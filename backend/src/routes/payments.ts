import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import Razorpay from "razorpay";
import Payment, { type IPayment } from "../models/Payment.js";
import CampaignCreator from "../models/CampaignCreator.js";
import Creator from "../models/Creator.js";
import { validateBody, paymentOrderSchema, paymentVerifySchema } from "../middleware/validation.js";

const router = Router();

function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured on the server");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function requireWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured on the server");
  }
  return secret;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function markPaid(payment: IPayment, paymentId: string, signature?: string) {
  if (payment.status === "PAID") return payment; // idempotent — webhooks can retry
  payment.status = "PAID";
  payment.paymentId = paymentId;
  if (signature) payment.signature = signature;
  payment.paidAt = new Date();
  await payment.save();
  return payment;
}

// POST /api/payments/order — create a Razorpay order for a creator's booking advance.
// The amount always comes from the creator's estimatedCost server-side.
router.post(
  "/order",
  validateBody(paymentOrderSchema),
  async (req: Request, res: Response) => {
    try {
      const { campaignId, creatorId } = req.body;

      const link = await CampaignCreator.findOne({ campaignId, creatorId });
      if (!link || link.status !== "APPROVED") {
        return res
          .status(400)
          .json({ error: "Creator must be APPROVED in this campaign before paying an advance" });
      }

      const creator = await Creator.findById(creatorId).lean();
      if (!creator) return res.status(404).json({ error: "Creator not found" });

      const amount = Math.max(100, Math.round(creator.estimatedCost || 25000));

      let rzp: Razorpay;
      try {
        rzp = getRazorpay();
      } catch (err) {
        return res.status(500).json({ error: (err as Error).message });
      }

      const receipt = `${campaignId.toString().slice(-6)}-${creatorId.toString().slice(-6)}-${Date.now()}`;
      const order = await rzp.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt,
        notes: { campaignId, creatorId },
      });

      const payment = await Payment.create({
        campaignId,
        creatorId,
        orderId: order.id,
        amount,
        currency: "INR",
        receipt,
      });

      res.status(201).json({
        orderId: order.id,
        amount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID ?? "",
        paymentDbId: payment._id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  }
);

// POST /api/payments/verify — synchronous checkout confirmation.
router.post("/verify", validateBody(paymentVerifySchema), async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ error: "Razorpay keys are not configured" });

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (!safeEqual(expected, signature)) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const updated = await markPaid(payment, paymentId, signature);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// GET /api/payments?campaignId= — paid advances for a campaign pipeline view.
router.get("/", async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.query;
    const filter: Record<string, string> = {};
    if (typeof campaignId === "string" && campaignId) filter.campaignId = campaignId;

    const payments = await Payment.find(filter).sort({ createdAt: -1 }).lean();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// POST /api/payments/webhook — server-to-server confirmation. Mounted with an
// express.raw parser BEFORE the global json middleware so the raw body stays
// intact for HMAC verification.
export async function razorpayWebhook(req: Request, res: Response) {
  try {
    const secret = requireWebhookSecret();
    const raw = req.body as Buffer;
    const received = (req.headers["x-razorpay-signature"] as string | undefined) ?? "";

    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (!safeEqual(expected, received)) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // req.body is a Buffer because express.raw({ type: "*/*" }) handles this
    // route before the global JSON parser. Verify the HMAC over the exact
    // bytes Razorpay sent, then decode the payload manually.
    const event = JSON.parse(raw.toString("utf8")) as {
      event: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
    };
    const entity = event.payload?.payment?.entity;
    console.log(`[razorpay webhook] ${event.event} order=${entity?.order_id ?? "?"}`);

    if (entity?.order_id) {
      const payment = await Payment.findOne({ orderId: entity.order_id });
      if (!payment) return res.json({ status: "ignored" });

      if (event.event === "payment.captured") {
        await markPaid(payment, entity.id ?? payment.paymentId ?? "");
      } else if (event.event === "payment.failed") {
        payment.status = "FAILED";
        payment.paymentId = entity.id;
        await payment.save();
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    // Always 200 on handler-level issues so Razorpay doesn't retry forever;
    // only signature failures above return 400.
    res.status(200).json({ status: "error" });
  }
}

export default router;

import type { PaymentOrderResponse } from "../types/payment";

// Minimal shape of window.Razorpay from checkout.js — we only use open().
interface RazorpayCheckoutInstance {
  open(): void;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayCheckoutInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the Razorpay checkout script"));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface RazorpayCheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function openRazorpayCheckout(
  order: PaymentOrderResponse,
  creatorName: string
): Promise<RazorpayCheckoutResult> {
  await loadCheckoutScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Razorpay checkout is unavailable");

  return new Promise<RazorpayCheckoutResult>((resolve, reject) => {
    const checkout = new Razorpay({
      key: order.keyId,
      amount: order.amount * 100,
      currency: order.currency,
      name: "Creator Hunter",
      description: `Booking advance — ${creatorName}`,
      order_id: order.orderId,
      theme: { color: "#0d9488" },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
      handler: (response) => resolve(response),
    });
    checkout.open();
  });
}

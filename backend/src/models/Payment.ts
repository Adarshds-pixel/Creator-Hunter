import mongoose, { Schema, type Document, type Types } from "mongoose";

const STATUSES = ["CREATED", "PAID", "FAILED"] as const;
export type PaymentStatus = (typeof STATUSES)[number];

export interface IPayment extends Document {
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;

  orderId: string;
  paymentId?: string;
  signature?: string;

  amount: number;
  currency: string;
  receipt?: string;

  status: PaymentStatus;
  paidAt?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "Creator", required: true },

    orderId: { type: String, required: true, index: true },
    paymentId: { type: String },
    signature: { type: String },

    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    receipt: { type: String },

    status: { type: String, enum: STATUSES, default: "CREATED" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const PAYMENT_STATUSES = STATUSES;
export default mongoose.model<IPayment>("Payment", paymentSchema);

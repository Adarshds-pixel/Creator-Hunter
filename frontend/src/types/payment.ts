export type PaymentStatus = "CREATED" | "PAID" | "FAILED";

export interface Payment {
  _id: string;
  campaignId: string;
  creatorId: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentDbId: string;
}

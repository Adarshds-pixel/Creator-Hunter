import mongoose, { Schema, type Document } from "mongoose";

const ROLES = ["OWNER", "ADMIN", "CAMPAIGN_MANAGER", "RESEARCHER", "VIEWER"] as const;
export type UserRole = (typeof ROLES)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  company?: string;
  role: UserRole;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    company: { type: String },
    role: { type: String, enum: ROLES, default: "VIEWER" },
  },
  { timestamps: true }
);

export const ROLE_VALUES = ROLES;
export default mongoose.model<IUser>("User", userSchema);

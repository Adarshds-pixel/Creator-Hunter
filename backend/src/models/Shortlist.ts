import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IShortlistCreator {
  creatorId: Types.ObjectId;
  notes?: string;
}

export interface IShortlist extends Document {
  name: string;
  userId: Types.ObjectId;
  creators: IShortlistCreator[];
}

const shortlistCreatorSchema = new Schema<IShortlistCreator>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: "Creator", required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

const shortlistSchema = new Schema<IShortlist>(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    creators: [shortlistCreatorSchema],
  },
  { timestamps: true }
);

shortlistSchema.index({ userId: 1 });

export default mongoose.model<IShortlist>("Shortlist", shortlistSchema);

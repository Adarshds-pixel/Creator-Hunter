export interface ShortlistCreator {
  creatorId: string;
  notes?: string;
}

export interface Shortlist {
  _id: string;
  name: string;
  userId: string;
  creators: ShortlistCreator[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Campaign {
  _id?: string;
  name: string;
  brand?: string;
  product?: string;
  description?: string;
  budget?: number;
  targetCountry?: string;
  targetCity?: string;
  targetCategory?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetGender?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

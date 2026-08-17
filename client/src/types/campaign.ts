export interface Campaign {
  _id?: string;
  name: string;
  brand?: string;
  budget?: number;
  targetCountry?: string;
  targetCategory?: string;
  minFollowers?: number;
  maxFollowers?: number;
  platform?: string;
  status?: string;
}

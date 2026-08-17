import { z } from "zod";

export const campaignFormSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  brand: z.string().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  targetCountry: z.string().optional(),
  targetCategory: z.string().optional(),
  minFollowers: z.coerce.number().nonnegative().optional(),
  maxFollowers: z.coerce.number().nonnegative().optional(),
  platform: z.string().optional(),
});

export const searchFormSchema = z.object({
  query: z.string().min(3, "Describe who you're looking for"),
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
export type SearchFormValues = z.infer<typeof searchFormSchema>;

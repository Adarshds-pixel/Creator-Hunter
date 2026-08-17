import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { campaignFormSchema, type CampaignFormValues } from "../../lib/validation";

interface CampaignFormProps {
  onSubmit: (values: CampaignFormValues) => void;
}

type FormState = Record<keyof CampaignFormValues, string>;

const INITIAL_STATE: FormState = {
  name: "",
  brand: "",
  budget: "",
  targetCountry: "",
  targetCategory: "",
  minFollowers: "",
  maxFollowers: "",
  platform: "",
};

const FIELDS: { key: keyof FormState; label: string }[] = [
  { key: "name", label: "Campaign name" },
  { key: "brand", label: "Brand" },
  { key: "budget", label: "Budget (₹)" },
  { key: "targetCountry", label: "Target country" },
  { key: "targetCategory", label: "Target category" },
  { key: "minFollowers", label: "Min followers" },
  { key: "maxFollowers", label: "Max followers" },
  { key: "platform", label: "Platform" },
];

// Member C — Campaigns & Outreach
export function CampaignForm({ onSubmit }: CampaignFormProps) {
  const [values, setValues] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string[]>>>({});

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = campaignFormSchema.safeParse(values);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{field.label}</label>
          <input
            value={values[field.key]}
            onChange={handleChange(field.key)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          {errors[field.key] && (
            <span className="text-xs text-red-600">{errors[field.key]?.[0]}</span>
          )}
        </div>
      ))}

      <Button type="submit" className="sm:col-span-2">
        Create Campaign
      </Button>
    </form>
  );
}

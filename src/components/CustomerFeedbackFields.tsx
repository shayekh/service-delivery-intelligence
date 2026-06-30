"use client";

export interface CustomerFeedback {
  satisfaction: string;
  communication: string;
  responsiveness: string;
  business_alignment: string;
  areas_of_concern: string;
}

const SECTIONS: { key: keyof CustomerFeedback; label: string; placeholder: string }[] = [
  {
    key: "satisfaction",
    label: "Customer Satisfaction",
    placeholder:
      "How satisfied was the customer overall? Any formal or informal feedback received...",
  },
  {
    key: "communication",
    label: "Communication",
    placeholder:
      "How was the quality and frequency of communication? Any issues or highlights...",
  },
  {
    key: "responsiveness",
    label: "Responsiveness",
    placeholder:
      "How responsive was the SELISE team to customer requests and queries...",
  },
  {
    key: "business_alignment",
    label: "Business Alignment",
    placeholder: "How well aligned were deliverables with customer business goals...",
  },
  {
    key: "areas_of_concern",
    label: "Areas of Concern",
    placeholder: "Any concerns raised by the customer or observed by the team...",
  },
];

export function CustomerFeedbackFields({
  value,
  onChange,
}: {
  value: CustomerFeedback;
  onChange: (value: CustomerFeedback) => void;
}) {
  return (
    <div className="space-y-5">
      {SECTIONS.map((section) => (
        <div key={section.key}>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {section.label}
          </label>
          <textarea
            value={value[section.key]}
            onChange={(e) => onChange({ ...value, [section.key]: e.target.value })}
            placeholder={section.placeholder}
            className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );
}

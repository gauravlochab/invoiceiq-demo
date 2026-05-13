"use client";

const categoryClassMap: Record<string, string> = {
  "Medical Equipment": "badge category-equipment",
  "Pharmaceuticals": "badge category-pharma",
  "Surgical Supplies": "badge category-surgical",
  "Sterilization": "badge category-sterilization",
  "GPO — General": "badge category-gpo",
};

const categoryLabels: Record<string, string> = {
  "Medical Equipment": "Medical Equipment",
  "Pharmaceuticals": "Pharmaceuticals",
  "Surgical Supplies": "Surgical Supplies",
  "Sterilization": "Sterilization",
  "GPO — General": "GPO — General",
};

export function CategoryBadge({ category }: { category: string }) {
  const className = categoryClassMap[category];
  const label = categoryLabels[category];
  if (!className) return null;
  return (
    <span className={`${className} inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap`}>
      {label}
    </span>
  );
}

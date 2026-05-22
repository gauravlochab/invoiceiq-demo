"use client";

import { Badge } from "@/components/ui/badge";

// [Spec: rules/ui-standard.md#v1→v2 Migration Map]
// Product categories — rendered with the shadcn Badge primitive. The category
// name is its own label, so color is not the only signal (WCAG 1.4.1). A stable
// data-category attribute keeps each category identifiable for tests/automation.
const categoryLabels: Record<string, string> = {
  "Medical Equipment": "Medical Equipment",
  "Pharmaceuticals": "Pharmaceuticals",
  "Surgical Supplies": "Surgical Supplies",
  "Sterilization": "Sterilization",
  "GPO — General": "GPO — General",
};

const categorySlugs: Record<string, string> = {
  "Medical Equipment": "category-equipment",
  "Pharmaceuticals": "category-pharma",
  "Surgical Supplies": "category-surgical",
  "Sterilization": "category-sterilization",
  "GPO — General": "category-gpo",
};

export function CategoryBadge({ category }: { category: string }) {
  const label = categoryLabels[category];
  const slug = categorySlugs[category];
  if (!label) return null;
  return (
    <Badge variant="secondary" data-category={slug}>
      {label}
    </Badge>
  );
}

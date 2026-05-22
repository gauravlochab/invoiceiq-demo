"use client";

import { getVendorInfo } from "@/lib/vendors";

interface VendorBadgeProps {
  name: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const sizeConfig = {
  sm: { circle: "w-6 h-6", text: "text-[9px]", name: "text-xs", gap: "gap-2", px: 24 },
  md: { circle: "w-8 h-8", text: "text-[11px]", name: "text-sm", gap: "gap-2.5", px: 32 },
  lg: { circle: "w-10 h-10", text: "text-xs", name: "text-base font-semibold", gap: "gap-3", px: 40 },
};

export function VendorBadge({ name, size = "sm", showName = true }: VendorBadgeProps) {
  const vendor = getVendorInfo(name);
  const s = sizeConfig[size];

  return (
    <span className={`inline-flex items-center ${s.gap}`}>
      {vendor.logo ? (
        <img
          src={vendor.logo}
          alt={vendor.name}
          width={s.px}
          height={s.px}
          className={`${s.circle} rounded-full object-contain flex-shrink-0`}
        />
      ) : (
        <span
          className={`${s.circle} rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${s.text}`}
          style={{ backgroundColor: vendor.color, color: vendor.textColor }}
          title={vendor.name}
        >
          {vendor.initials}
        </span>
      )}
      {showName && (
        <span className={`${s.name} text-foreground truncate`}>
          {size === "sm" ? vendor.shortName : vendor.name}
        </span>
      )}
    </span>
  );
}

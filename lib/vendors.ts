export interface VendorInfo {
  name: string;
  shortName: string;
  initials: string;
  color: string;
  textColor: string;
  logo?: string;
}

export const VENDOR_CONFIG: Record<string, VendorInfo> = {
  "Cardinal Health": {
    name: "Cardinal Health",
    shortName: "Cardinal",
    initials: "CH",
    color: "#c41e3a",
    textColor: "#ffffff",
    logo: "/logos/cardinal-health.svg",
  },
  "Steris Corporation": {
    name: "Steris Corporation",
    shortName: "Steris",
    initials: "ST",
    color: "#003366",
    textColor: "#ffffff",
    logo: "/logos/steris.svg",
  },
  "MedTech Solutions LLC": {
    name: "MedTech Solutions LLC",
    shortName: "MedTech",
    initials: "MT",
    color: "#4b5563",
    textColor: "#ffffff",
    logo: "/logos/medtech.svg",
  },
  "MedSupply Corp": {
    name: "MedSupply Corp",
    shortName: "MedSupply",
    initials: "MS",
    color: "#0369a1",
    textColor: "#ffffff",
    logo: "/logos/medsupply.svg",
  },
  "Henry Schein": {
    name: "Henry Schein",
    shortName: "Henry Schein",
    initials: "HS",
    color: "#0065cb",
    textColor: "#ffffff",
    logo: "/logos/henry-schein.svg",
  },
  "Vizient Inc.": {
    name: "Vizient Inc.",
    shortName: "Vizient",
    initials: "VZ",
    color: "#7c3aed",
    textColor: "#ffffff",
    logo: "/logos/vizient.svg",
  },
  "BioMed Equipment Inc.": {
    name: "BioMed Equipment Inc.",
    shortName: "BioMed",
    initials: "BE",
    color: "#059669",
    textColor: "#ffffff",
    logo: "/logos/biomed.svg",
  },
  "Medline Industries": {
    name: "Medline Industries",
    shortName: "Medline",
    initials: "ML",
    color: "#0d47a1",
    textColor: "#ffffff",
    logo: "/logos/medline.svg",
  },
  "Owens & Minor": {
    name: "Owens & Minor",
    shortName: "O&M",
    initials: "OM",
    color: "#b45309",
    textColor: "#ffffff",
    logo: "/logos/owens-minor.svg",
  },
  "Stryker Medical": {
    name: "Stryker Medical",
    shortName: "Stryker",
    initials: "SM",
    color: "#6d28d9",
    textColor: "#ffffff",
    logo: "/logos/stryker.svg",
  },
  "Baxter Healthcare": {
    name: "Baxter Healthcare",
    shortName: "Baxter",
    initials: "BH",
    color: "#0284c7",
    textColor: "#ffffff",
    logo: "/logos/baxter.svg",
  },
  "Becton Dickinson": {
    name: "Becton Dickinson",
    shortName: "Becton",
    initials: "BD",
    color: "#1e3a5f",
    textColor: "#ffffff",
    logo: "/logos/becton-dickinson.svg",
  },
  "Johnson & Johnson MedTech": {
    name: "Johnson & Johnson MedTech",
    shortName: "J&J",
    initials: "JJ",
    color: "#d41e25",
    textColor: "#ffffff",
    logo: "/logos/jnj.svg",
  },
  "Abbott Laboratories": {
    name: "Abbott Laboratories",
    shortName: "Abbott",
    initials: "AL",
    color: "#005daa",
    textColor: "#ffffff",
    logo: "/logos/abbott.svg",
  },
  "McKesson Medical-Surgical": {
    name: "McKesson Medical-Surgical",
    shortName: "McKesson",
    initials: "MK",
    color: "#004c97",
    textColor: "#ffffff",
    logo: "/logos/mckesson.svg",
  },
  "Philips Healthcare": {
    name: "Philips Healthcare",
    shortName: "Philips",
    initials: "PH",
    color: "#0b5ed7",
    textColor: "#ffffff",
    logo: "/logos/philips.svg",
  },
  "Zimmer Biomet": {
    name: "Zimmer Biomet",
    shortName: "Zimmer",
    initials: "ZB",
    color: "#374151",
    textColor: "#ffffff",
    logo: "/logos/zimmer.svg",
  },
  "Teleflex Medical": {
    name: "Teleflex Medical",
    shortName: "Teleflex",
    initials: "TM",
    color: "#0f766e",
    textColor: "#ffffff",
    logo: "/logos/teleflex.svg",
  },
  "Apex Family Pharmacy Inc": {
    name: "Apex Family Pharmacy Inc",
    shortName: "Apex",
    initials: "AF",
    color: "#9333ea",
    textColor: "#ffffff",
    logo: "/logos/apex.svg",
  },
  "Tarheel Drugs": {
    name: "Tarheel Drugs",
    shortName: "Tarheel",
    initials: "TD",
    color: "#dc2626",
    textColor: "#ffffff",
    logo: "/logos/tarheel.svg",
  },
  "Westside Pharmacy": {
    name: "Westside Pharmacy",
    shortName: "Westside",
    initials: "WP",
    color: "#be185d",
    textColor: "#ffffff",
    logo: "/logos/westside.svg",
  },
};

export function getVendorInfo(vendorName: string): VendorInfo {
  if (VENDOR_CONFIG[vendorName]) return VENDOR_CONFIG[vendorName];

  const words = vendorName.split(/[\s&]+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : vendorName.slice(0, 2).toUpperCase();

  let hash = 0;
  for (let i = 0; i < vendorName.length; i++) {
    hash = vendorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return {
    name: vendorName,
    shortName: vendorName.split(/[\s,]+/)[0],
    initials,
    color: `hsl(${hue}, 45%, 35%)`,
    textColor: "#ffffff",
  };
}

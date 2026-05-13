export interface User {
  name: string;
  initials: string;
  role: string;
  email: string;
  permissions: string[];
}

export const currentUser: User = {
  name: "Rajesh Jaluka",
  initials: "RJ",
  role: "AP Analyst",
  email: "rajesh.jaluka@parklandhealth.org",
  permissions: [
    "view_exceptions",
    "review_exceptions",
    "escalate_exceptions",
    "export_data",
    "view_recovery",
    "initiate_recovery",
    "view_vendors",
    "view_pipeline",
    "view_som",
    "override_som",
  ],
};

export function hasPermission(permission: string): boolean {
  return currentUser.permissions.includes(permission);
}

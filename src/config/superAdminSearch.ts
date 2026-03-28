export type SuperAdminSearchItem = {
  id: string;
  title: string;
  message: string;
  href: string;
  kind: "menu" | "setting" | "link";
};

export const SUPER_ADMIN_SEARCH_ITEMS: SuperAdminSearchItem[] = [
  {
    id: "menu-dashboard",
    title: "Dashboard",
    message: "Open super admin dashboard overview.",
    href: "/dashboard",
    kind: "menu",
  },
  {
    id: "menu-companies",
    title: "Companies",
    message: "Manage platform companies and their details.",
    href: "/companies",
    kind: "menu",
  },
  {
    id: "menu-users",
    title: "Users",
    message: "View and manage super admin users.",
    href: "/users",
    kind: "menu",
  },
  {
    id: "menu-orphan-data",
    title: "Orphan data",
    message: "Review orphaned records that need action.",
    href: "/orphan-data",
    kind: "menu",
  },
  {
    id: "menu-settings",
    title: "Settings",
    message: "Open main platform settings.",
    href: "/settings",
    kind: "menu",
  },
  {
    id: "menu-company-defaults",
    title: "Company defaults",
    message: "Configure defaults used for new companies.",
    href: "/settings/company-defaults",
    kind: "menu",
  },
  {
    id: "menu-platform-catalog",
    title: "Platform catalog",
    message: "Manage industries, dashboard uses, and skillsets.",
    href: "/settings/platform-catalog",
    kind: "menu",
  },
  {
    id: "setting-inactivity",
    title: "Inactivity settings",
    message: "Control warning and deletion rules for inactivity.",
    href: "/settings?tab=inactivity",
    kind: "setting",
  },
  {
    id: "setting-other",
    title: "Other settings",
    message: "Open additional settings section.",
    href: "/settings?tab=other",
    kind: "setting",
  },
  {
    id: "setting-company-auto-ids",
    title: "Auto IDs",
    message: "Manage project, employee, and client ID defaults.",
    href: "/settings/company-defaults?tab=bootstrap",
    kind: "setting",
  },
  {
    id: "setting-company-weekend",
    title: "Company weekend defaults",
    message: "Set default weekend days for newly created companies.",
    href: "/settings/company-defaults?tab=weekendDefaults",
    kind: "setting",
  },
  {
    id: "setting-company-contract-models",
    title: "Client contract models",
    message: "Manage default contract models for new companies.",
    href: "/settings/company-defaults?tab=contractModels",
    kind: "setting",
  },
  {
    id: "setting-company-departments",
    title: "Departments",
    message: "Configure department templates for companies.",
    href: "/settings/company-defaults?tab=departments",
    kind: "setting",
  },
  {
    id: "setting-company-designations",
    title: "Designations",
    message: "Configure designation templates for companies.",
    href: "/settings/company-defaults?tab=designations",
    kind: "setting",
  },
  {
    id: "setting-company-activities",
    title: "Timesheet activities",
    message: "Manage default activity types for timesheets.",
    href: "/settings/company-defaults?tab=activities",
    kind: "setting",
  },
  {
    id: "setting-company-leave-types",
    title: "Leave types",
    message: "Configure default leave type templates.",
    href: "/settings/company-defaults?tab=leaveTypes",
    kind: "setting",
  },
  {
    id: "setting-company-default-roles",
    title: "Default roles",
    message: "Set default role mappings for new companies.",
    href: "/settings/company-defaults?tab=defaultRoles",
    kind: "setting",
  },
  {
    id: "setting-catalog-industries",
    title: "Industries",
    message: "Manage platform industries and project types.",
    href: "/settings/platform-catalog?tab=industries",
    kind: "setting",
  },
  {
    id: "setting-catalog-dashboard-use",
    title: "Dashboard primary use",
    message: "Manage dashboard primary use options.",
    href: "/settings/platform-catalog?tab=dashboardUses",
    kind: "setting",
  },
  {
    id: "setting-catalog-skillsets",
    title: "Skillsets",
    message: "Manage skill categories and skills.",
    href: "/settings/platform-catalog?tab=skillsets",
    kind: "setting",
  },
  {
    id: "link-profile",
    title: "Profile",
    message: "Open your super admin profile page.",
    href: "/profile",
    kind: "link",
  },
];

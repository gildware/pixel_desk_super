"use client";

import CompanyDefaultWidgetLayoutsPanel from "@/src/components/company-defaults/CompanyDefaultWidgetLayoutsPanel";

export default function CompanyDefaultWidgetsTab() {
  return (
    <div>
      <h4 className="mb-1 text-theme-sm font-semibold text-gray-900 dark:text-white/90">
        Default Widgets
      </h4>
      <CompanyDefaultWidgetLayoutsPanel />
    </div>
  );
}

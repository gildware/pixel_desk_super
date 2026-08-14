"use client";

import React from "react";
import ApiSecurityTracker from "@/src/components/apis/ApiSecurityTracker";

export default function ApisPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white/90">
          APIs
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Backend route registry with tenant isolation, live API, role, frontend, and
          functional test status.
        </p>
      </div>
      <div className="col-span-12">
        <ApiSecurityTracker />
      </div>
    </div>
  );
}

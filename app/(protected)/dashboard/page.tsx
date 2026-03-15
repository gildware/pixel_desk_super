import React from "react";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white/90">Dashboard</h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Welcome to PixelDesk Super Admin.</p>
      </div>
      <div className="col-span-12 rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:col-span-6 xl:col-span-4">
        <p className="text-theme-sm font-medium text-gray-500 dark:text-gray-400">Companies</p>
        <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">—</p>
        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">Total companies</p>
      </div>
      <div className="col-span-12 rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:col-span-6 xl:col-span-4">
        <p className="text-theme-sm font-medium text-gray-500 dark:text-gray-400">Users</p>
        <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">—</p>
        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">Total users</p>
      </div>
      <div className="col-span-12 rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:col-span-6 xl:col-span-4">
        <p className="text-theme-sm font-medium text-gray-500 dark:text-gray-400">Activity</p>
        <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">—</p>
        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">Recent activity</p>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/src/services/api/dashboard.api";
import type { DashboardStats } from "@/src/types/dashboard.types";
import { TableIcon, UserIcon, TaskIcon } from "@/src/icons/index";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      })
      .finally(() => setLoading(false));
  }, []);

  const formatCount = (n: number | undefined) =>
    loading ? "—" : (n ?? 0).toLocaleString();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white/90">
          Dashboard
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Welcome to PixelDesk Super Admin.
        </p>
      </div>

      {error && (
        <div className="col-span-12 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="col-span-12 sm:col-span-6 xl:col-span-4">
        <Link
          href="/companies"
          className="block rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm transition-colors hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 dark:hover:bg-white/[0.06]"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            <TableIcon />
          </span>
          <p className="mt-3 text-theme-sm font-medium text-gray-500 dark:text-gray-400">
            Companies
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {formatCount(stats?.totalCompanies)}
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            Total companies
          </p>
        </Link>
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-4">
        <Link
          href="/users"
          className="block rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm transition-colors hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 dark:hover:bg-white/[0.06]"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <UserIcon />
          </span>
          <p className="mt-3 text-theme-sm font-medium text-gray-500 dark:text-gray-400">
            Users
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {formatCount(stats?.totalUsers)}
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            Total users
          </p>
        </Link>
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <TaskIcon />
          </span>
          <p className="mt-3 text-theme-sm font-medium text-gray-500 dark:text-gray-400">
            Projects
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {formatCount(stats?.totalProjects)}
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            Total projects
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/src/services/api/user.api";
import { logout } from "@/src/services/api/auth.api";
import type { SessionUser } from "@/src/types/auth.types";

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe();
        setUser(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      window.location.href = "/login";
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Loading profile…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-theme-sm text-error-500">{error}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Profile
          </h3>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-error-200 px-4 py-2 text-theme-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-800 dark:hover:bg-error-950"
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{user.email}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">First name</p>
            <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{user.firstName ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Last name</p>
            <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{user.lastName ?? "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

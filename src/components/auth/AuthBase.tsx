"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { requestOtp, verifyOtp, logout, getSession } from "@/src/services/api/auth.api";
import { useSession } from "@/src/context/SessionContext";
import LoginForm from "@/src/components/auth/LoginForm";
import OtpVerification from "@/src/components/auth/OtpVerification";

const REDIRECT_ATTEMPT_KEY = "auth-redirect-to-dashboard";

export default function AuthBase() {
  const { session, loading: sessionLoading, refetch } = useSession();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loggingOut, setLoggingOut] = useState(false);
  const [redirectBlocked, setRedirectBlocked] = useState(false);
  const hasRedirected = useRef(false);

  // Only global super admins can access dashboard; others are logged out and stay on login
  useEffect(() => {
    if (sessionLoading) return;
    if (session?.user && session.user.isGlobalSuperAdmin !== true) {
      logout()
        .then(() => refetch())
        .catch(() => refetch());
      return;
    }
    if (session?.user && session.user.isGlobalSuperAdmin === true) {
      // Loop breaker: if we were just sent back from dashboard (server had no session), don't redirect again
      if (typeof window !== "undefined" && sessionStorage.getItem(REDIRECT_ATTEMPT_KEY) === "1") {
        sessionStorage.removeItem(REDIRECT_ATTEMPT_KEY);
        setRedirectBlocked(true);
        return;
      }
      // Set flags synchronously first so Strict Mode / double effect run doesn't trigger redirect twice
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(REDIRECT_ATTEMPT_KEY, "1");
      }
      window.location.replace("/dashboard");
    }
  }, [session?.user, session?.user?.isGlobalSuperAdmin, sessionLoading, refetch]);

  const handleRequestOtp = async (value: string) => {
    try {
      setLoading(true);
      setError(undefined);
      await requestOtp(value);
      setEmail(value);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    try {
      setLoading(true);
      setError(undefined);
      await requestOtp(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!email) return;
    try {
      setLoading(true);
      setError(undefined);
      await verifyOtp(email, otp);
      // Session cookie is set by backend; only global super admins can access dashboard
      const session = await getSession();
      if (session?.user && session.user.isGlobalSuperAdmin !== true) {
        await logout();
        setError("Only global super admins can access this dashboard.");
        return;
      }
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

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

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Loading…
        </p>
      </div>
    );
  }

  // Logged in but not global super admin: useEffect is logging them out; show message until session is cleared
  if (session?.user && session.user.isGlobalSuperAdmin !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Signing out…
        </p>
      </div>
    );
  }

  // Already logged in as global super admin: redirect to dashboard (handled in useEffect), or show message if loop was detected
  if (session?.user && session.user.isGlobalSuperAdmin === true) {
    if (redirectBlocked) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-md px-4 text-center">
            <p className="text-theme-sm text-gray-600 dark:text-gray-300 mb-4">
              Session is valid but the dashboard could not be reached. This can happen if the app and API use different domains.
            </p>
            <Link
              href="/dashboard"
              className="text-theme-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              Try opening dashboard →
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Redirecting to dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md px-4">
        {!email ? (
          <LoginForm
            onContinue={handleRequestOtp}
            loading={loading}
            error={error}
          />
        ) : (
          <OtpVerification
            email={email}
            onVerify={handleVerifyOtp}
            onResendOtp={handleResendOtp}
            loading={loading}
            error={error}
          />
        )}
        <p className="mt-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
          <Link href="/dashboard" className="hover:text-brand-500">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface LoginFormProps {
  onContinue: (email: string) => Promise<void> | void;
  loading: boolean;
  error?: string;
}

export default function LoginForm({
  onContinue,
  loading,
  error,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidEmail) return;
    onContinue(email);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
          Sign In to PixelDesk Admin
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Enter your email to receive a one-time password.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-gray-500"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {touched && !isValidEmail && (
            <p className="mt-1 text-theme-xs text-error-500">Please enter a valid email address.</p>
          )}
          {error && (
            <p className="mt-1 text-theme-xs text-error-500">{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!isValidEmail || loading}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send OTP"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

const RESEND_COOLDOWN_SECONDS = 60;

interface OtpVerificationProps {
  email: string;
  onVerify?: (otp: string) => Promise<void> | void;
  onResendOtp?: () => Promise<void> | void;
  loading: boolean;
  error?: string;
}

export default function OtpVerification({
  email,
  onVerify,
  onResendOtp,
  loading,
  error,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading || !onResendOtp) return;
    try {
      setResendLoading(true);
      await onResendOtp();
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResendLoading(false);
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;

    const digits = pasted.replace(/\D/g, "").slice(0, otp.length);
    if (!digits) return;

    const nextOtp = [...otp];
    for (let i = 0; i < digits.length && index + i < nextOtp.length; i++) {
      nextOtp[index + i] = digits[i];
    }
    setOtp(nextOtp);

    const filledUntil = Math.min(index + digits.length - 1, nextOtp.length - 1);
    const nextIndex =
      filledUntil < nextOtp.length - 1 ? filledUntil + 1 : filledUntil;
    const nextInput = document.getElementById(`otp-${nextIndex}`);
    nextInput?.focus();
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const otpValue = otp.join("");
  const isOtpComplete = otp.every((d) => d.length === 1);
  const canSubmit = isOtpComplete && !loading;

  const submitOtp = async () => {
    if (!canSubmit) return;
    await onVerify?.(otpValue);
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] sm:p-8 text-center w-full">
      <p className="text-theme-sm text-gray-600 dark:text-gray-400">
        We have sent you the code at
      </p>

      <p className="mt-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
        {email}
      </p>

      <p className="mt-4 text-theme-sm text-gray-500 dark:text-gray-400">
        To login the dashboard, Enter the code here
      </p>

      <div className="mt-4 flex justify-center gap-2 sm:gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            value={digit}
            maxLength={1}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={(e) => handlePaste(e, index)}
            className={`h-11 w-11 rounded-lg text-center text-lg font-medium text-gray-800 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-white/[0.03] sm:h-12 sm:w-12 ${
              error
                ? "border-2 border-error-500 dark:border-error-500"
                : "border border-gray-200 dark:border-gray-700"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-theme-xs text-error-500">{error}</p>
      )}

      <button
        type="button"
        onClick={submitOtp}
        disabled={!canSubmit}
        className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify OTP"}
      </button>

      {onResendOtp && (
        <div className="mt-6 flex flex-col items-center gap-1">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Didn&apos;t receive the code?
          </p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || resendLoading}
            className="text-theme-sm font-medium text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {resendLoading
              ? "Sending…"
              : resendCooldown > 0
                ? `Resend OTP (${resendCooldown}s)`
                : "Resend OTP"}
          </button>
        </div>
      )}
    </div>
  );
}

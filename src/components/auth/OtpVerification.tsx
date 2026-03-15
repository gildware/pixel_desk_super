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
    <div className="signin-banner-from-wrap">
      <div className="signin-banner-title-box">
        <h5 className="signin-banner-from-title">
          We have sent you the code at
        </h5>
      </div>

      <div className="signin-banner-from-box text-center">
        <small>{email || "test@mail.com"}</small>

        <form>
          <div className="row">
            <small>To login the dashboard, Enter the code here</small>
            <div className="col-12 mt-2">
              <div className="mb-6 flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    value={digit}
                    maxLength={1}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={(e) => handlePaste(e, index)}
                    className="h-12 w-12 rounded-md text-center text-lg"
                    style={
                      error
                        ? { border: "1px solid red" }
                        : { border: "1px solid #d1d5db" }
                    }
                  />
                ))}
              </div>

              {/* ✅ ERROR MESSAGE */}
              {error && (
                <small style={{ color: "red", display: "block", marginTop: 6 }}>
                  {error}
                </small>
              )}
            </div>
          </div>
        </form>

        <div className="signin-banner-from-btn mt-20">
          <button
            type="button"
            className="signin-btn w-full"
            onClick={submitOtp}
            disabled={!canSubmit}
            style={
              !canSubmit
                ? { cursor: "not-allowed", opacity: 0.6 }
                : { cursor: "pointer" }
            }
          >
            {loading ? (
              <span className="d-inline-flex align-items-center gap-2">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                />
                Verifying...
              </span>
            ) : (
              "Verify OTP"
            )}
          </button>

          {onResendOtp && (
            <div className="mt-4 text-center">
              <small className="d-block text-muted mb-2">
                Didn&apos;t receive the code?
              </small>
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resendLoading}
                style={
                  resendCooldown > 0 || resendLoading
                    ? { cursor: "not-allowed", opacity: 0.6 }
                    : { cursor: "pointer" }
                }
              >
                {resendLoading ? (
                  <span className="d-inline-flex align-items-center gap-2">
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    />
                    Sending...
                  </span>
                ) : resendCooldown > 0 ? (
                  `Resend OTP (${resendCooldown}s)`
                ) : (
                  "Resend OTP"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

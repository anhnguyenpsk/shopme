"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const initialToken = searchParams.get("token");

  const [code, setCode] = useState("");
  const [token, setToken] = useState(initialToken || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      toast.error("Email is required for verification");
      router.push("/register");
    }
  }, [email, router]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = code.split("");
    newCode[index] = value;
    const updatedCode = newCode.join("");
    setCode(updatedCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (updatedCode.length === 6) {
      handleVerify(updatedCode);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (/^\d+$/.test(pastedData)) {
      setCode(pastedData);
      
      // Focus the last filled input or first empty one
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
      
      // Auto-submit if 6 digits
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  const handleVerify = async (verificationCode = code) => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    if (!token) {
      toast.error("Verification token is missing. Please request a new code.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: verificationCode,
          token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Verification failed");
      }

      toast.success("Email verified successfully! Redirecting to login...");
      
      // Redirect to login page after 1.5 seconds
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      toast.error(error.message || "Verification failed. Please try again.");
      console.error("VERIFY_ERROR:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) {
      toast.error("Please wait before requesting a new code");
      return;
    }

    setIsResending(true);

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Failed to resend code");
      }

      const data = await res.json();
      
      // Update token and reset timer
      setToken(data.token);
      setTimeRemaining(180);
      setCanResend(false);
      setCode("");
      
      // Clear all inputs and focus first one
      inputRefs.current.forEach((ref) => {
        if (ref) ref.value = "";
      });
      inputRefs.current[0]?.focus();

      toast.success("New verification code sent to your email!");
    } catch (error) {
      toast.error(error.message || "Failed to resend code");
      console.error("RESEND_ERROR:", error);
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Register */}
      <div className="fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" asChild>
          <Link href="/register">← Back to Register</Link>
        </Button>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a 6-digit code to
          </p>
          <p className="text-center text-sm font-medium text-blue-600">
            {email}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                className={`text-lg font-semibold ${
                  timeRemaining < 60 ? "text-red-600" : "text-blue-600"
                }`}
              >
                {formatTime(timeRemaining)}
              </span>
              <span className="ml-2 text-sm text-gray-600">remaining</span>
            </div>
          </div>

          {/* Code Input */}
          <div>
            <Label className="block text-center mb-4 text-gray-700">
              Enter verification code
            </Label>
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  className="w-12 h-14 text-center text-2xl font-bold"
                  value={code[index] || ""}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerify()}
            className="w-full"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </Button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn&apos;t receive the code?
            </p>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={!canResend || isResending}
              className={`${
                canResend ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {isResending
                ? "Sending..."
                : canResend
                ? "Resend Code"
                : `Resend in ${formatTime(timeRemaining)}`}
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Note:</strong> The verification code expires in 3 minutes.
              Make sure to check your spam folder if you don&apos;t see the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}














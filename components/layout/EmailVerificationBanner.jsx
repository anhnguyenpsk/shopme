"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function EmailVerificationBanner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Check if banner was dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("emailBannerDismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("emailBannerDismissed", "true");
  };

  const handleVerifyClick = async () => {
    if (!session?.user?.email) {
      toast.error("Không tìm thấy email trong phiên làm việc");
      return;
    }

    setIsSending(true);

    try {
      // Send verification email
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Gửi email xác thực thất bại");
      }

      const data = await res.json();

      // Redirect to verification page with token and email
      router.push(
        `/register/verify?email=${encodeURIComponent(session.user.email)}&token=${data.token}`
      );
    } catch (error) {
      toast.error(error.message || "Gửi email xác thực thất bại");
      console.error("SEND_VERIFICATION_ERROR:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Don't show banner if:
  // - Session is loading
  // - User is not logged in
  // - Email is already verified
  // - Banner was dismissed
  if (
    status === "loading" ||
    !session?.user ||
    session.user.emailVerified ||
    isDismissed
  ) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
            <p className="ml-3 font-medium text-yellow-800 truncate">
              <span className="md:hidden">Vui lòng xác thực email của bạn</span>
              <span className="hidden md:inline">
                Địa chỉ email của bạn chưa được xác thực. Vui lòng xác thực email để sử dụng tất cả tính năng.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <Button
              onClick={handleVerifyClick}
              disabled={isSending}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
            >
              {isSending ? "Đang gửi..." : "Xác thực Email"}
            </Button>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="-mr-1 flex p-2 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}














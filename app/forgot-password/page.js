"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Đã xảy ra lỗi");
            }

            setSuccessMessage(result.message);
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Quên Mật khẩu
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Nhập địa chỉ email để nhận liên kết đặt lại mật khẩu của bạn.
                    </p>
                </div>

                {successMessage ? (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{successMessage}</p>
                                <div className="mt-4">
                                    <Link href="/login" className="text-sm font-medium text-green-600 hover:text-green-500 hover:underline">
                                        Quay lại đăng nhập
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Địa chỉ Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    disabled={isLoading}
                                    {...register("email", {
                                        required: "Email là bắt buộc",
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Địa chỉ email không hợp lệ"
                                        }
                                    })}
                                    className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.email ? "border-red-300" : "border-gray-300"
                                        }`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                                {errorMessage}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Gửi liên kết đặt lại
                            </button>
                        </div>

                        <div className="flex items-center justify-center">
                            <Link href="/login" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

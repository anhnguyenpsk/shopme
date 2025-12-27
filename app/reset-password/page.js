"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Suspense } from 'react';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const id = searchParams.get("id");
    const token = searchParams.get("token");

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    // Redirect if missing params
    useEffect(() => {
        if (!id || !token) {
            // Ideally show an error or redirect, but for now we just handle it on submit
        }
    }, [id, token]);


    const onSubmit = async (data) => {
        if (!id || !token) {
            setErrorMessage("Liên kết không hợp lệ. Vui lòng kiểm tra email của bạn và thử lại.");
            return;
        }

        setIsLoading(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    token,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Đã xảy ra lỗi");
            }

            setSuccessMessage("Đặt lại mật khẩu thành công.");
            setTimeout(() => {
                router.push("/login?reset=success");
            }, 2000);
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!id || !token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg text-center">
                    <h3 className="text-lg font-medium text-red-600">Liên kết không hợp lệ</h3>
                    <p className="text-gray-600">Liên kết đặt lại mật khẩu này không hợp lệ hoặc không đầy đủ.</p>
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">Yêu cầu liên kết mới</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Đặt lại mật khẩu
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Nhập mật khẩu mới của bạn bên dưới.
                    </p>
                </div>

                {successMessage ? (
                    <div className="rounded-md bg-green-50 p-4">
                        <p className="text-sm font-medium text-green-800">{successMessage}</p>
                        <p className="mt-2 text-xs text-green-600">Đang chuyển hướng đến trang đăng nhập...</p>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Mật khẩu mới
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        type="password"
                                        disabled={isLoading}
                                        {...register("password", {
                                            required: "Mật khẩu là bắt buộc",
                                            minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
                                        })}
                                        className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.password ? "border-red-300" : "border-gray-300"
                                            }`}
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Xác nhận mật khẩu
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        disabled={isLoading}
                                        {...register("confirmPassword", {
                                            required: "Vui lòng xác nhận mật khẩu của bạn",
                                            validate: (val) => {
                                                if (watch('password') != val) {
                                                    return "Mật khẩu không khớp";
                                                }
                                            }
                                        })}
                                        className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.confirmPassword ? "border-red-300" : "border-gray-300"
                                            }`}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                                    )}
                                </div>
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
                                Đặt lại mật khẩu
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}

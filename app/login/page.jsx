"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { update } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.ok) {
        // Force session update to get latest role
        const session = await update();

        if (session?.user) {
          // Role-based routing
          switch (session.user.role) {
            case 'ADMIN':
              toast.success("Chào mừng quản trị viên!");
              router.push("/admin/dashboard");
              break;
            case 'STORE_OWNER':
              toast.success("Chào mừng chủ cửa hàng!");
              router.push("/store/dashboard");
              break;
            case 'CUSTOMER':
              toast.success("Chào mừng trở lại!");
              router.push("/");
              break;
            default:
              toast.success("Đăng nhập thành công!");
              router.push("/");
          }
        }
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi đăng nhập");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">← Về Trang chủ</Link>
        </Button>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập vào tài khoản
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập thông tin xác thực để truy cập ShopMe
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Địa chỉ Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Bạn chưa có tài khoản?{" "}
              <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Đăng ký
              </a>
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

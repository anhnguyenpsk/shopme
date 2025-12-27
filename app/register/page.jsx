"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Vui lòng điền vào tất cả các trường bắt buộc");
      return false;
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      toast.error("Tên phải từ 2 đến 50 ký tự");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ");
      return false;
    }
    if (password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu không khớp");
      return false;
    }
    // Validate phone number format (Vietnam) if provided
    if (phone && phone.trim()) {
      const phoneRegex = /^(\+84|0)(3|5|7|8|9)([0-9]{8})$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        toast.error("Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0912345678 hoặc +84912345678)");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      // Create user via our API (defaults to CUSTOMER role)
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone.trim() || undefined,
          gender: gender || undefined,
          dateOfBirth: dateOfBirth || undefined,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Đăng ký thất bại");
      }

      const data = await res.json();

      toast.success("Tạo tài khoản thành công! Vui lòng xác thực email của bạn.");

      // Redirect to verification page with token and email
      router.push(
        `/register/verify?email=${encodeURIComponent(email)}&token=${data.token}`
      );
    } catch (error) {
      toast.error(error.message || "Đã xảy ra lỗi");
      console.error("REGISTER_ERROR:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home - top-left fixed, matching Login */}
      <div className="fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">← Về Trang chủ</Link>
        </Button>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Tạo tài khoản mới
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tham gia ShopMe để bắt đầu mua sắm và bán hàng
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên của bạn"
                disabled={isLoading}
              />
            </div>

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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tạo mật khẩu"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                disabled={isLoading}
              />
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Thông tin bổ sung (tùy chọn)</p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678 or +84912345678"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Giới tính</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={isLoading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Đăng nhập
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}


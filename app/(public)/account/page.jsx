"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import OrderItem from "@/components/checkout/OrderItem";
import PageTitle from "@/components/shared/PageTitle";
import VoucherWallet from "@/components/vouchers/VoucherWallet";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    image: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    if (session && activeTab === "profile") {
      fetchProfile();
    }
  }, [session, activeTab]);

  // Fetch orders
  useEffect(() => {
    if (session && activeTab === "purchase") {
      fetchOrders();
    }
  }, [session, activeTab]);

  // Fetch addresses
  useEffect(() => {
    if (session && activeTab === "addresses") {
      fetchAddresses();
    }
  }, [session, activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split("T")[0] : "",
          image: data.image || "",
        });
        setImagePreview(data.image || null);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Kích thước ảnh phải nhỏ hơn 2MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn tệp hình ảnh");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch addresses, status:", res.status);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = profile.image;

      // If there's a new image file, upload it first
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('oldImage', profile.image || '');

        const uploadRes = await fetch('/api/upload/profile-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || 'Tải ảnh lên thất bại');
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imagePath;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          gender: profile.gender,
          dateOfBirth: profile.dateOfBirth,
          image: imageUrl,
        }),
      });

      if (res.ok) {
        toast.success("Cập nhật hồ sơ thành công!");
        setImageFile(null);
        // Refresh profile to get updated data
        fetchProfile();
      } else {
        const error = await res.json();
        toast.error(error.error || "Cập nhật hồ sơ thất bại");
      }
    } catch (error) {
      toast.error(error.message || "Đã xảy ra lỗi");
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingAddress
        ? `/api/addresses/${editingAddress.id}`
        : "/api/addresses";
      const method = editingAddress ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });

      if (res.ok) {
        toast.success(
          editingAddress ? "Cập nhật địa chỉ thành công!" : "Thêm địa chỉ thành công!"
        );
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
          name: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          country: "",
        });
        fetchAddresses();
      } else {
        const error = await res.json();
        toast.error(error.error || "Lưu địa chỉ thất bại");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;

    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Xóa địa chỉ thành công!");
        fetchAddresses();
      } else {
        toast.error("Xóa địa chỉ thất bại");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
    });
    setShowAddressForm(true);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tài khoản của tôi</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`${activeTab === "profile"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Hồ sơ
            </button>
            <button
              onClick={() => setActiveTab("purchase")}
              className={`${activeTab === "purchase"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Đơn mua
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`${activeTab === "addresses"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Địa chỉ
            </button>
            <button
              onClick={() => setActiveTab("vouchers")}
              className={`${activeTab === "vouchers"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Kho Voucher
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Thông tin cá nhân
              </h2>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                  <div className="relative w-24 h-24">
                    {imagePreview ? (
                      imagePreview.startsWith('data:') ? (
                        // Preview from file selection (base64)
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        // Saved image from server (file path)
                        <Image
                          src={imagePreview}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="rounded-full object-cover border-2 border-gray-200"
                        />
                      )
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <span className="text-3xl text-gray-500">
                          {profile.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="profileImage" className="block mb-2">
                      Ảnh đại diện
                    </Label>
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Khuyến nghị: Ảnh vuông, tối đa 2MB (JPG, PNG, GIF)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Họ tên</Label>
                    <Input
                      id="name"
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email không thể thay đổi
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      placeholder="0912345678 hoặc +84912345678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Giới tính</Label>
                    <select
                      id="gender"
                      value={profile.gender}
                      onChange={(e) =>
                        setProfile({ ...profile, gender: e.target.value })
                      }
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
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) =>
                        setProfile({ ...profile, dateOfBirth: e.target.value })
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Purchase Tab */}
          {activeTab === "purchase" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Đơn hàng của tôi
              </h2>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderItem key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Bạn chưa có đơn hàng nào</p>
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Địa chỉ của tôi
                </h2>
                <Button
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({
                      name: "",
                      phone: "",
                      street: "",
                      city: "",
                      state: "",
                      country: "",
                    });
                    setShowAddressForm(true);
                  }}
                >
                  Thêm địa chỉ mới
                </Button>
              </div>

              {showAddressForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium mb-4">
                    {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                  </h3>
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="addressName">Tên</Label>
                        <Input
                          id="addressName"
                          type="text"
                          value={addressForm.name}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="addressPhone">Số điện thoại</Label>
                        <Input
                          id="addressPhone"
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, phone: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="street">Địa chỉ (Số nhà, đường...)</Label>
                        <Input
                          id="street"
                          type="text"
                          value={addressForm.street}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, street: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="city">Thành phố</Label>
                        <Input
                          id="city"
                          type="text"
                          value={addressForm.city}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, city: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="state">Tỉnh/Thành phố</Label>
                        <Input
                          id="state"
                          type="text"
                          value={addressForm.state}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, state: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="country">Quốc gia</Label>
                        <Input
                          id="country"
                          type="text"
                          value={addressForm.country}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, country: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                      >
                        Hủy
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Đang lưu..." : "Lưu địa chỉ"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {address.name}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{address.phone}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        {address.street}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state}
                      </p>
                      <p className="text-sm text-gray-600">{address.country}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Chưa có địa chỉ nào được thêm</p>
                </div>
              )}
            </div>
          )}

          {/* Vouchers Tab */}
          {activeTab === "vouchers" && <VoucherWallet />}
        </div>
      </div>
    </div>
  );
}


"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Eye
} from "lucide-react";
import { useEffect, useState } from "react";
import Loading from "@/components/shared/Loading";
import { formatVND } from "@/lib/utils/currency";

export default function StoreDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalEarnings: 0,
    monthlyGrowth: 0,
    activeCustomers: 0,
    pageViews: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/store/dashboard');
        if (response.ok) {
          const data = await response.json();
          const dashboardData = data.dashboardData || {};
          setStats(prevStats => ({
            ...prevStats,
            totalProducts: dashboardData.totalProducts || 0,
            totalOrders: dashboardData.totalOrders || 0,
            totalRevenue: dashboardData.totalEarnings || 0,
          }));
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error('Failed to fetch dashboard data:', response.status, errData.error || response.statusText);
        }
      } catch (error) {
        console.error('An error occurred while fetching dashboard data:', error);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Cửa hàng</h1>
          <p className="text-gray-600">Chào mừng trở lại, {session?.user?.name}!</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Vai trò</p>
          <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
            {session?.user?.role}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Sản phẩm hoạt động trong cửa hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Đơn hàng nhận trong tháng này
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVND(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Tổng doanh thu tháng này
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tăng trưởng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.monthlyGrowth}%</div>
            <p className="text-xs text-muted-foreground">
              Tăng trưởng so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Khách hàng đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt xem trang</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Lượt xem trong tháng này
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/store/products/add" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="font-medium text-blue-900">Thêm sản phẩm mới</div>
              <div className="text-sm text-blue-600">Tạo danh sách sản phẩm mới</div>
            </a>
            <a href="/store/orders" className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="font-medium text-green-900">Xem đơn hàng</div>
              <div className="text-sm text-green-600">Quản lý các đơn hàng gần đây</div>
            </a>
            <a href="/store/settings" className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="font-medium text-purple-900">Cài đặt cửa hàng</div>
              <div className="text-sm text-purple-600">Cập nhật thông tin cửa hàng</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Đã nhận đơn hàng mới</p>
                  <p className="text-xs text-gray-500">2 phút trước</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sản phẩm đã cập nhật</p>
                  <p className="text-xs text-gray-500">1 giờ trước</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Đã nhận đánh giá mới</p>
                  <p className="text-xs text-gray-500">3 giờ trước</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

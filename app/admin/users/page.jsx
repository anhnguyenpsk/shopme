'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  ShoppingBag,
  Store,
  UserCog
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function UsersManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, byRole: {} });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
  }, [session, status, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [session, fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleToggleActive = async (userId, currentIsActive) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentIsActive })
      });

      if (response.ok) {
        toast.success('User status updated successfully');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error updating user status');
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'STORE_OWNER': return 'default';
      case 'CUSTOMER': return 'secondary';
      default: return 'outline';
    }
  };

  if (status === 'loading' || loading && users.length === 0) {
    return <Loading />;
  }

  return (
    <div className="text-slate-500">
      <h1 className="text-2xl mb-6">
        Quản lý <span className="text-slate-800 font-medium">Người dùng</span>
      </h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tổng người dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole?.CUSTOMER || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="h-4 w-4" />
              Chủ cửa hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole?.STORE_OWNER || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole?.ADMIN || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Tìm kiếm theo Tên hoặc Email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="role-filter">Lọc theo vai trò</Label>
              <Select value={roleFilter} onValueChange={(value) => {
                setRoleFilter(value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger id="role-filter">
                  <SelectValue placeholder="Tất cả vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
                  <SelectItem value="STORE_OWNER">Chủ cửa hàng</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tất cả người dùng</CardTitle>
          <CardDescription>
            Quản lý tài khoản và vai trò người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Không tìm thấy người dùng
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-medium">Người dùng</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Trạng thái</th>
                      <th className="pb-3 font-medium">Cửa hàng</th>
                      <th className="pb-3 font-medium">Ngày tham gia</th>
                      <th className="pb-3 font-medium text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || 'User'}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                <span className="text-slate-600 font-semibold">
                                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                            <span className="font-medium">{user.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-4">{user.email}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                            {user.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          {user.store ? (
                            <div className="text-sm">
                              <div className="font-medium">{user.store.name}</div>
                              <div className="text-slate-400">@{user.store.username}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 text-sm">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm">Active</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                onChange={() => toast.promise(
                                  handleToggleActive(user.id, user.isActive),
                                  { loading: 'Updating...' }
                                )}
                                checked={user.isActive}
                                disabled={user.id === session?.user?.id}
                              />
                              <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                              <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-4"></span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} trong số{' '}
                  {pagination.total} người dùng
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Tiếp
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


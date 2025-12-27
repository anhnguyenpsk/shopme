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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Folder,
  AlertCircle,
  CheckCircle,
  Edit,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
  }, [session, status, router]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/categories?${params}`);

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error fetching categories');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchCategories();
    }
  }, [session, fetchCategories]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const openCreateDialog = () => {
    setFormData({
      name: '',
      slug: '',
      isActive: true,
      parentId: null,
    });
    setFormErrors({});
    setIsCreating(true);
    setSelectedCategory(null);
    setIsEditDialogOpen(true);
  };

  const openEditDialog = (category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      isActive: category.isActive,
      parentId: category.parent ? category.parent.id : null,
    });
    setFormErrors({});
    setIsCreating(false);
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const url = isCreating
        ? '/api/admin/categories'
        : `/api/admin/categories/${selectedCategory.id}`;

      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Category ${isCreating ? 'created' : 'updated'} successfully`);
        setIsEditDialogOpen(false);
        fetchCategories();
      } else {
        toast.error(data.error || `Failed to ${isCreating ? 'create' : 'update'} category`);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      const response = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Category deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null);
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Error deleting category');
    }
  };

  if (status === 'loading' || loading && categories.length === 0) {
    return <Loading />;
  }

  return (
    <div className="text-slate-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">
          Quản lý <span className="text-slate-800 font-medium">Danh mục</span>
        </h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Tổng danh mục
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Ngừng hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive || 0}</div>
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
              <Label htmlFor="search">Tìm kiếm theo tên danh mục</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tìm kiếm danh mục..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status-filter">Lọc theo trạng thái</Label>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Tất cả danh mục</CardTitle>
          <CardDescription>
            Quản lý tất cả danh mục sản phẩm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Không tìm thấy danh mục nào
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Folder className="h-5 w-5 text-slate-500" />
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                        </div>
                        <Badge variant={category.isActive ? 'default' : 'destructive'}>
                          {category.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">
                        Slug: <span className="font-mono">{category.slug}</span>
                      </p>
                      {category.parent && (
                        <p className="text-sm text-slate-500 mb-3">
                          Parent: <span className="font-medium text-slate-700">{category.parent.name}</span>
                        </p>
                      )}
                      <p className="text-sm text-slate-600 mb-4">
                        {category._count.products} sản phẩm
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(category)}
                          className="text-red-600 hover:text-red-700"
                          disabled={category._count.products > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} trong số{' '}
                  {pagination.total} danh mục
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

      {/* Create/Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Tạo danh mục mới' : 'Chỉnh sửa danh mục'}</DialogTitle>
            <DialogDescription>
              {isCreating
                ? 'Thêm danh mục mới vào hệ thống.'
                : 'Cập nhật thông tin danh mục.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Tên danh mục *</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ví dụ: Điện tử, Quần áo"
              />
              {formErrors.name && (
                <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="category-slug">Slug (tùy chọn)</Label>
              <Input
                id="category-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Để trống để tự động tạo"
              />
              <p className="text-xs text-slate-500 mt-1">
                Định danh thân thiện với URL. Tự động tạo từ tên nếu để trống.
              </p>
            </div>
            <div>
              <Label htmlFor="parent-category">Danh mục cha (tùy chọn)</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? null : value })}
              >
                <SelectTrigger id="parent-category">
                  <SelectValue placeholder="Chọn danh mục cha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có (Cấp cao nhất)</SelectItem>
                  {categories
                    .filter(c => c.id !== selectedCategory?.id) // Prevent selecting self as parent
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Chọn danh mục cha để tạo danh mục con.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="category-active">Trạng thái hoạt động</Label>
                <p className="text-xs text-slate-500">
                  Danh mục không hoạt động sẽ không xuất hiện trong danh sách sản phẩm
                </p>
              </div>
              <Switch
                id="category-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang lưu...' : (isCreating ? 'Tạo danh mục' : 'Cập nhật danh mục')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa danh mục</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa "{selectedCategory?.name}"?
              Hành động này không thể hoàn tác.
              {selectedCategory?._count?.products > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Cảnh báo: Danh mục này đang có {selectedCategory._count.products} sản phẩm liên kết.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Xóa danh mục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}






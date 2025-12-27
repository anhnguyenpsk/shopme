'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Loading from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Tag,
  AlertCircle,
  CheckCircle,
  Edit,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BrandsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [brands, setBrands] = useState([]);
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
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
  }, [session, status, router]);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/brands?${params}`);

      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        toast.error('Failed to fetch brands');
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Error fetching brands');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchBrands();
    }
  }, [session, fetchBrands]);

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
      logo: '',
      description: '',
      isActive: true,
    });
    setFormErrors({});
    setLogoPreview(null);
    setIsCreating(true);
    setSelectedBrand(null);
    setIsEditDialogOpen(true);
  };

  const openEditDialog = (brand) => {
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      description: brand.description || '',
      isActive: brand.isActive,
    });
    setFormErrors({});
    setLogoPreview(brand.logo);
    setIsCreating(false);
    setSelectedBrand(brand);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (brand) => {
    setSelectedBrand(brand);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Brand name is required';
    }
    if (!formData.logo.trim()) {
      errors.logo = 'Brand logo is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/brand-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({ ...prev, logo: data.path }));
        setLogoPreview(data.path);
        toast.success('Logo uploaded successfully');
      } else {
        toast.error(data.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const url = isCreating
        ? '/api/admin/brands'
        : `/api/admin/brands/${selectedBrand.id}`;

      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Brand ${isCreating ? 'created' : 'updated'} successfully`);
        setIsEditDialogOpen(false);
        fetchBrands();
      } else {
        toast.error(data.error || `Failed to ${isCreating ? 'create' : 'update'} brand`);
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.error('Error saving brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;

    try {
      const response = await fetch(`/api/admin/brands/${selectedBrand.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Brand deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedBrand(null);
        fetchBrands();
      } else {
        toast.error(data.error || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Error deleting brand');
    }
  };

  if (status === 'loading' || loading && brands.length === 0) {
    return <Loading />;
  }

  return (
    <div className="text-slate-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">
          Quản lý <span className="text-slate-800 font-medium">Thương hiệu</span>
        </h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm thương hiệu
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tổng thương hiệu
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
              <Label htmlFor="search">Tìm kiếm theo tên thương hiệu</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tìm kiếm thương hiệu..."
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
                  <SelectValue placeholder="Tất cả thương hiệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brands Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Tất cả thương hiệu</CardTitle>
          <CardDescription>
            Quản lý tất cả thương hiệu sản phẩm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Không tìm thấy thương hiệu nào
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {brands.map((brand) => (
                  <Card key={brand.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {brand.logo ? (
                            <div className="relative size-12 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                              <Image
                                src={brand.logo}
                                alt={brand.name}
                                fill
                                className="object-contain p-1"
                              />
                            </div>
                          ) : (
                            <Tag className="h-5 w-5 text-slate-500" />
                          )}
                          <h3 className="font-semibold text-lg">{brand.name}</h3>
                        </div>
                        <Badge variant={brand.isActive ? 'default' : 'destructive'}>
                          {brand.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </Badge>
                      </div>
                      {brand.description && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {brand.description}
                        </p>
                      )}
                      <p className="text-sm text-slate-500 mb-3">
                        Slug: <span className="font-mono">{brand.slug}</span>
                      </p>
                      <p className="text-sm text-slate-600 mb-4">
                        {brand._count.products} sản phẩm
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(brand)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(brand)}
                          className="text-red-600 hover:text-red-700"
                          disabled={brand._count.products > 0}
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
                  {pagination.total} thương hiệu
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
            <DialogTitle>{isCreating ? 'Tạo thương hiệu mới' : 'Chỉnh sửa thương hiệu'}</DialogTitle>
            <DialogDescription>
              {isCreating
                ? 'Thêm danh mục mới vào hệ thống.'
                : 'Cập nhật thông tin danh mục.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="brand-name">Tên thương hiệu *</Label>
              <Input
                id="brand-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ví dụ: Nike, Rolex"
              />
              {formErrors.name && (
                <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="brand-slug">Slug (tùy chọn)</Label>
              <Input
                id="brand-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Để trống để tự động tạo"
              />
              <p className="text-xs text-slate-500 mt-1">
                Định danh thân thiện với URL. Tự động tạo từ tên nếu để trống.
              </p>
            </div>
            <div>
              <Label htmlFor="brand-logo">Logo thương hiệu *</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="relative size-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={logoPreview}
                      alt="Xem trước logo"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="brand-logo"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Tối đa 2MB. Định dạng: JPG, PNG, GIF, WEBP
                  </p>
                  {formErrors.logo && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.logo}</p>
                  )}
                  {uploadingLogo && (
                    <p className="text-sm text-blue-600 mt-1">Đang tải lên...</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="brand-description">Mô tả (tùy chọn)</Label>
              <Textarea
                id="brand-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả tóm tắt về thương hiệu"
                rows={3}
              />
              <p className="text-xs text-slate-500 mt-1">
                Một đoạn mô tả ngắn về thương hiệu này
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="brand-active">Trạng thái hoạt động</Label>
                <p className="text-xs text-slate-500">
                  Thương hiệu không hoạt động sẽ không xuất hiện trong danh sách
                </p>
              </div>
              <Switch
                id="brand-active"
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
              {submitting ? 'Đang lưu...' : (isCreating ? 'Tạo thương hiệu' : 'Cập nhật thương hiệu')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa thương hiệu</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa "{selectedBrand?.name}"?
              Hành động này không thể hoàn tác.
              {selectedBrand?._count?.products > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Cảnh báo: Thương hiệu này đang có {selectedBrand._count.products} sản phẩm liên kết.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteBrand}>
              Xóa thương hiệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


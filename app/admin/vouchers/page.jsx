'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import VoucherForm from '@/components/vouchers/VoucherForm';
import { formatVND } from '@/lib/currency';

export default function VouchersManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
  }, [session, status, router]);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/vouchers`);

      if (response.ok) {
        const data = await response.json();
        setVouchers(data.data);
      } else {
        toast.error('Lỗi khi tải danh sách voucher');
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Lỗi khi tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchVouchers();
    }
  }, [session, fetchVouchers]);

  const handleFormSubmit = async (data) => {
    const url = editingVoucher
      ? `/api/admin/vouchers/${editingVoucher.id}`
      : '/api/admin/vouchers';
    const method = editingVoucher ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(`Voucher đã được ${editingVoucher ? 'cập nhật' : 'tạo'} thành công!`);
        setIsDialogOpen(false);
        setEditingVoucher(null);
        fetchVouchers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Đã xảy ra lỗi.');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi.');
    }
  };

  const openCreateDialog = () => {
    setEditingVoucher(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (voucher) => {
    const formattedVoucher = {
      ...voucher,
      start_date: voucher.start_date.split('T')[0],
      end_date: voucher.end_date.split('T')[0],
    };
    setEditingVoucher(formattedVoucher);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (voucher) => {
    setVoucherToDelete(voucher);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!voucherToDelete) return;

    try {
      const response = await fetch(`/api/admin/vouchers/${voucherToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Voucher deleted successfully!');
        fetchVouchers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete voucher.');
      }
    } catch (error) {
      toast.error('An error occurred.');
    } finally {
      setIsDeleteConfirmOpen(false);
      setVoucherToDelete(null);
    }
  };

  if (status === 'loading' || (loading && vouchers.length === 0)) {
    return <Loading />;
  }

  return (
    <div className="text-slate-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">
          Quản lý <span className="text-slate-800 font-medium">Voucher</span>
        </h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm Voucher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả Voucher</CardTitle>
          <CardDescription>
            Quản lý mã giảm giá của nền tảng và vận chuyển
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Không tìm thấy voucher nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Sử dụng</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">{voucher.name}</TableCell>
                    <TableCell>{voucher.voucher_code || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={voucher.voucher_type === 'PLATFORM' ? 'default' : 'secondary'}>
                        {voucher.voucher_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {voucher.discount_type === 'PERCENTAGE'
                        ? `${voucher.discount_value}% (tối đa ${formatVND(voucher.max_discount_amount)})`
                        : formatVND(voucher.discount_value)}
                    </TableCell>
                    <TableCell>{voucher._count.userVouchers} / {voucher.total_usage_limit}</TableCell>
                    <TableCell>{new Date(voucher.start_date).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{new Date(voucher.end_date).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <Badge variant={voucher.status === 'ACTIVE' ? 'default' : 'destructive'}>
                        {voucher.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(voucher)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(voucher)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}</DialogTitle>
          </DialogHeader>
          <VoucherForm
            mode={editingVoucher ? 'edit' : 'create'}
            initialData={editingVoucher}
            onSubmit={handleFormSubmit}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bạn có chắc chắn?</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn voucher này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

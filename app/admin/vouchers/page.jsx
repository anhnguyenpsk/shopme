'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
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
        toast.error('Failed to fetch vouchers');
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Error fetching vouchers');
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
        toast.success(`Voucher ${editingVoucher ? 'updated' : 'created'} successfully!`);
        setIsDialogOpen(false);
        setEditingVoucher(null);
        fetchVouchers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'An error occurred.');
      }
    } catch (error) {
      toast.error('An error occurred.');
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
          Vouchers <span className="text-slate-800 font-medium">Management</span>
        </h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Voucher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vouchers</CardTitle>
          <CardDescription>
            Manage all platform and shipping vouchers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No vouchers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
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
                        ? `${voucher.discount_value}% (max ${formatVND(voucher.max_discount_amount)})`
                        : formatVND(voucher.discount_value)}
                    </TableCell>
                    <TableCell>{voucher._count.userVouchers} / {voucher.total_usage_limit}</TableCell>
                    <TableCell>{new Date(voucher.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(voucher.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={voucher.status === 'ACTIVE' ? 'default' : 'destructive'}>
                        {voucher.status}
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
            <DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}</DialogTitle>
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
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the voucher.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

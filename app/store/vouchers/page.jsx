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
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Ticket, Clock, Calendar, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import VoucherForm from '@/components/vouchers/VoucherForm';
import { formatVND } from '@/lib/currency';

const tabs = ['All', 'Ongoing', 'Upcoming', 'Expired'];

export default function StoreVouchersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Redirect if not store owner
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'STORE_OWNER') {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab.toLowerCase(),
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });
      const response = await fetch(`/api/store/vouchers?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setVouchers(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch vouchers');
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Error fetching vouchers');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, sortConfig]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFormSubmit = async (data) => {
    const url = editingVoucher
      ? `/api/store/vouchers/${editingVoucher.id}`
      : '/api/store/vouchers';
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
      applicableProductIds: voucher.applicableProducts ? voucher.applicableProducts.map(p => p.id) : []
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
      const response = await fetch(`/api/store/vouchers/${voucherToDelete.id}`, {
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

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" /> 
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (status === 'loading') {
    return <Loading />;
  }

  return (
    <div className="text-slate-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">
          My Vouchers <span className="text-slate-800 font-medium">Management</span>
        </h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Voucher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Store Vouchers</CardTitle>
              <CardDescription>Manage your store's discount vouchers</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="border-b mt-4">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No vouchers found for this filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage (Used/Collected)</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50" 
                    onClick={() => handleSort('start_date')}
                  >
                    <div className="flex items-center">
                      Start Date <SortIcon columnKey="start_date" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-50" 
                    onClick={() => handleSort('end_date')}
                  >
                    <div className="flex items-center">
                      End Date <SortIcon columnKey="end_date" />
                    </div>
                  </TableHead>
                  <TableHead 
                     className="cursor-pointer hover:bg-slate-50" 
                     onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status <SortIcon columnKey="status" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">{voucher.name}</TableCell>
                    <TableCell>{voucher.voucher_code || '-'}</TableCell>
                    <TableCell>
                      {voucher.discount_type === 'PERCENTAGE'
                        ? `${voucher.discount_value}% (max ${formatVND(voucher.max_discount_amount)})`
                        : formatVND(voucher.discount_value)}
                    </TableCell>
                    <TableCell>{voucher.usedCount} / {voucher.collectedCount}</TableCell>
                    <TableCell>{voucher.total_usage_limit}</TableCell>
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
            voucherTypeRestriction="SHOP"
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

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductSelectorDialog from './ProductSelectorDialog';

const voucherSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  voucher_code: z.string().optional(),
  voucher_type: z.enum(['PLATFORM', 'SHIPPING', 'SHOP']),
  discount_type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE']),
  discount_value: z.coerce.number().positive('Discount value must be positive'),
  max_discount_amount: z.coerce.number().optional(),
  min_order_value: z.coerce.number().min(0).default(0),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  total_usage_limit: z.coerce.number().int().positive(),
  user_usage_limit: z.coerce.number().int().positive().default(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  applicableProductIds: z.array(z.string()).optional(),
}).refine(data => {
    if (data.discount_type === 'PERCENTAGE') {
        return data.max_discount_amount !== null && data.max_discount_amount > 0;
    }
    return true;
}, {
    message: "Max discount amount is required for percentage-based vouchers",
    path: ["max_discount_amount"],
});

const VoucherForm = ({ mode = 'create', initialData, onSubmit, isLoading, voucherTypeRestriction }) => {
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  
  const defaultValues = {
    voucher_type: voucherTypeRestriction || 'PLATFORM',
    discount_type: 'FIXED_AMOUNT',
    status: 'ACTIVE',
    user_usage_limit: 1,
    min_order_value: 0,
    applicableProductIds: [],
    name: '',
    description: '',
    voucher_code: '',
    discount_value: '',
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    total_usage_limit: '',
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(voucherSchema),
    defaultValues: initialData || defaultValues,
  });

  useEffect(() => {
    reset(initialData || defaultValues);
  }, [initialData, reset, voucherTypeRestriction]);

  const discountType = watch('discount_type');
  const applicableProductIds = watch('applicableProductIds');

  const handleProductSelect = (selectedIds) => {
    setValue('applicableProductIds', selectedIds);
  };

  // Determine voucher state logic
  const getVoucherState = () => {
    if (mode === 'create' || !initialData) return 'upcoming';
    
    const now = new Date();
    const startDate = new Date(initialData.start_date);
    const endDate = new Date(initialData.end_date);
    
    // Set time to midnight for accurate comparison if only date string is provided
    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate > now) return 'upcoming';
    if (endDate < now || ['ENDED', 'EXPIRED'].includes(initialData.status)) return 'expired';
    return 'ongoing';
  };

  const voucherState = getVoucherState();

  const isFieldDisabled = (fieldName) => {
    if (mode === 'create') return false;
    
    // Rules based on API restrictions
    if (voucherState === 'ongoing') {
      const allowed = [
        "name", "description", "end_date", "min_order_value", "status"
      ];
      return !allowed.includes(fieldName);
    }
    
    if (voucherState === 'expired') {
       const allowed = ["status", "description"];
       return !allowed.includes(fieldName);
    }
    
    return false; // Upcoming can edit everything
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Voucher Name</Label>
          <Input 
            id="name" 
            {...register('name')} 
            disabled={isFieldDisabled('name')}
            title={isFieldDisabled('name') ? "Cannot edit name for expired vouchers" : ""}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            {...register('description')} 
            disabled={isFieldDisabled('description')}
          />
        </div>

        <div>
          <Label htmlFor="voucher_code">Voucher Code (optional)</Label>
          <Input 
            id="voucher_code" 
            {...register('voucher_code')} 
            disabled={isFieldDisabled('voucher_code')}
            title={isFieldDisabled('voucher_code') ? "Cannot edit code for ongoing/expired vouchers" : ""}
          />
        </div>

        {!voucherTypeRestriction && (
          <div>
            <Label>Voucher Type</Label>
            <Controller
              name="voucher_type"
              control={control}
              render={({ field }) => (
                <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value} 
                    disabled={isFieldDisabled('voucher_type') || !!voucherTypeRestriction}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voucher type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLATFORM">Platform</SelectItem>
                    <SelectItem value="SHIPPING">Shipping</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Discount Type</Label>
            <Controller
              name="discount_type"
              control={control}
              render={({ field }) => (
                <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isFieldDisabled('discount_type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="discount_value">Discount Value</Label>
            <Input 
                id="discount_value" 
                type="number" 
                {...register('discount_value')} 
                disabled={isFieldDisabled('discount_value')}
            />
            {errors.discount_value && <p className="text-red-500 text-xs mt-1">{errors.discount_value.message}</p>}
          </div>
        </div>

        {discountType === 'PERCENTAGE' && (
          <div>
            <Label htmlFor="max_discount_amount">Max Discount Amount</Label>
            <Input 
                id="max_discount_amount" 
                type="number" 
                {...register('max_discount_amount')} 
                disabled={isFieldDisabled('max_discount_amount')}
            />
            {errors.max_discount_amount && <p className="text-red-500 text-xs mt-1">{errors.max_discount_amount.message}</p>}
          </div>
        )}

        <div>
          <Label htmlFor="min_order_value">Minimum Order Value</Label>
          <Input 
            id="min_order_value" 
            type="number" 
            {...register('min_order_value')} 
            disabled={isFieldDisabled('min_order_value')}
          />
        </div>

        {voucherTypeRestriction === 'SHOP' && (
            <div>
                <Label>Applicable Products</Label>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsProductSelectorOpen(true)}
                    disabled={isFieldDisabled('applicableProductIds')}
                >
                    Select Products ({applicableProductIds?.length || 0} selected)
                </Button>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input 
                id="start_date" 
                type="date" 
                {...register('start_date')} 
                disabled={isFieldDisabled('start_date')}
            />
            {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
          </div>
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input 
                id="end_date" 
                type="date" 
                {...register('end_date')} 
                disabled={isFieldDisabled('end_date')}
            />
            {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total_usage_limit">Total Usage Limit</Label>
            <Input 
                id="total_usage_limit" 
                type="number" 
                {...register('total_usage_limit')} 
                disabled={isFieldDisabled('total_usage_limit')}
            />
            {errors.total_usage_limit && <p className="text-red-500 text-xs mt-1">{errors.total_usage_limit.message}</p>}
          </div>
          <div>
            <Label htmlFor="user_usage_limit">User Usage Limit</Label>
            <Input 
                id="user_usage_limit" 
                type="number" 
                {...register('user_usage_limit')} 
                disabled={isFieldDisabled('user_usage_limit')}
            />
          </div>
        </div>
        
        <div>
          <Label>Status</Label>
          <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isFieldDisabled('status')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (mode === 'create' ? 'Create Voucher' : 'Update Voucher')}
        </Button>
      </form>
      <ProductSelectorDialog
        open={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onSelect={handleProductSelect}
        initialSelectedIds={applicableProductIds}
      />
    </>
  );
};

export default VoucherForm;

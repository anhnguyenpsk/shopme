'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatVND } from '@/lib/currency';
import Loading from '@/components/shared/Loading';
import { Ticket } from 'lucide-react';

const VoucherRadioItem = ({ result, onSelect, isSelected }) => {
  const { campaign, discountAmount } = result;
  const id = `voucher-${campaign.id}`;

  return (
    <div
      className={`flex items-center space-x-3 rounded-md border p-3 transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}
      onClick={() => onSelect(result)}
    >
      <RadioGroupItem value={id} id={id} checked={isSelected} />
      <Label htmlFor={id} className="flex-grow cursor-pointer">
        <div className="flex justify-between items-center">
          <div className="font-medium">{campaign.description || campaign.name}</div>
          <div className="font-semibold text-green-600">-{formatVND(discountAmount)}</div>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {campaign.discount_type === 'PERCENTAGE'
            ? `Save ${campaign.discount_value}%, max ${formatVND(campaign.max_discount_amount)}`
            : `Save ${formatVND(campaign.discount_value)}`}
        </div>
      </Label>
    </div>
  );
};

const VoucherGroup = ({ title, results, selectedValue, onSelect }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><Ticket size={16} className="mr-2" /> {title}</h4>
      <RadioGroup value={selectedValue ? `voucher-${selectedValue.campaign.id}` : ''} className="space-y-2">
        {results.map(result => (
          <VoucherRadioItem
            key={result.campaign.id}
            result={result}
            onSelect={() => onSelect(result)}
            isSelected={selectedValue?.campaign.id === result.campaign.id}
          />
        ))}
      </RadioGroup>
    </div>
  );
};

export default function VoucherSelectionModal({ open, onOpenChange, onApply, cartItems, initialSelectedVouchers }) {
  const [validatedVouchers, setValidatedVouchers] = useState({ SHOP: [], PLATFORM: [], SHIPPING: [] });
  const [selected, setSelected] = useState(initialSelectedVouchers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      const validate = async () => {
        if (!cartItems || cartItems.length === 0) {
          setError("Your cart is empty.");
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const response = await axios.post('/api/checkout/validate-vouchers', { cartItems });
          setValidatedVouchers(response.data.data);
        } catch (err) {
          console.error("Failed to validate vouchers", err);
          setError("Could not load available vouchers.");
        } finally {
          setLoading(false);
        }
      };
      validate();
    }
  }, [open, cartItems]);

  useEffect(() => {
    setSelected(initialSelectedVouchers);
  }, [initialSelectedVouchers]);

  const handleSelect = (group, result) => {
    setSelected(prev => {
      // If the same voucher is clicked again, deselect it
      if (prev[group]?.campaign.id === result.campaign.id) {
        return { ...prev, [group]: null };
      }
      return { ...prev, [group]: result };
    });
  };

  const handleApply = () => {
    onApply(selected);
    onOpenChange(false);
  };

  const totalDiscount = Object.values(selected).reduce((acc, curr) => {
    return acc + (curr ? curr.discountAmount : 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Select Voucher</DialogTitle>
          <DialogDescription>Select a discount voucher for your order. One voucher can be applied per type.</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <VoucherGroup
                title="Shop Vouchers"
                results={validatedVouchers.SHOP}
                selectedValue={selected.SHOP}
                onSelect={(result) => handleSelect('SHOP', result)}
              />
              <VoucherGroup
                title="ShopMe Vouchers"
                results={validatedVouchers.PLATFORM}
                selectedValue={selected.PLATFORM}
                onSelect={(result) => handleSelect('PLATFORM', result)}
              />
              <VoucherGroup
                title="Shipping Vouchers"
                results={validatedVouchers.SHIPPING}
                selectedValue={selected.SHIPPING}
                onSelect={(result) => handleSelect('SHIPPING', result)}
              />
              {validatedVouchers.SHOP.length === 0 && validatedVouchers.PLATFORM.length === 0 && validatedVouchers.SHIPPING.length === 0 && (
                <div className="text-center text-slate-500 py-8">No valid vouchers available for this order.</div>
              )}
            </>
          )}
        </div>
        <DialogFooter className="sm:justify-between items-center">
          <div className="text-sm">
            Total Discount: <span className="font-bold text-green-600">{formatVND(totalDiscount)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

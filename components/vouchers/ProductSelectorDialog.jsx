'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';
import Loading from '@/components/shared/Loading';

const ProductSelectorDialog = ({ open, onOpenChange, onSelect, initialSelectedIds = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/store/product');
          if (response.ok) {
            const data = await response.json();
            setProducts(data);
          } else {
            toast.error('Failed to fetch products.');
          }
        } catch (error) {
          toast.error('An error occurred while fetching products.');
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [open]);

  const handleSelect = (productId) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    onSelect(Array.from(selectedProducts));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Applicable Products</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ScrollArea className="h-72">
            {loading ? <Loading /> : (
              <div className="space-y-2">
                {filteredProducts.map(product => (
                  <div key={product.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-50">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => handleSelect(product.id)}
                    />
                    <label htmlFor={`product-${product.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {product.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Selection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectorDialog;

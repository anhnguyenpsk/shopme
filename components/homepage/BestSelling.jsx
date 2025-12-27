'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { formatVND } from '@/lib/currency'


const BestSelling = () => {
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestSellingProducts();
  }, []);

  const fetchBestSellingProducts = async () => {
    try {
      const response = await fetch('/api/products/best-selling');
      if (response.ok) {
        const data = await response.json();
        setBestSellingProducts(data.slice(0, 4)); // Get top 4 best-selling products
      }
    } catch (error) {
      console.error('Error fetching best-selling products:', error);
    } finally {
      setLoading(false);
    }
  };

  const ProductCard = ({ product }) => {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        <CardContent className="p-0">
          <Link href={`/product/${product.id}`}>
            <div className="relative overflow-hidden rounded-t-lg">
              <Image
                src={product.images[0] || '/api/placeholder/300/250'}
                alt={product.name}
                width={300}
                height={250}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-600">
                  {formatVND(product.price)}
                </span>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    )
  };

  const LoadingSkeleton = () => (
    <Card className="border-0 shadow-md">
      <CardContent className="p-0">
        <div className="animate-pulse">
          <div className="bg-slate-200 h-48 rounded-t-lg"></div>
          <div className="p-4 space-y-3">
            <div className="bg-slate-200 h-4 rounded"></div>
            <div className="bg-slate-200 h-3 w-2/3 rounded"></div>
            <div className="bg-slate-200 h-5 w-16 rounded"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4 mr-2" />
            Đang thịnh hành
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Sản phẩm bán chạy
          </h2>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Khám phá các sản phẩm phổ biến nhất được yêu thích bởi hàng ngàn khách hàng
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))
          ) : (
            bestSellingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button asChild size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
            <Link href="/shop">
              Xem tất cả sản phẩm
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BestSelling;

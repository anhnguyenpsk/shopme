'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap } from 'lucide-react';
import { formatVND } from '@/lib/currency';

const LatestProducts = () => {
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestProducts();
  }, []);

  const fetchLatestProducts = async () => {
    try {
      const response = await fetch('/api/products/latest');
      if (response.ok) {
        const data = await response.json();
        setLatestProducts(data.slice(0, 4)); // Get top 4 latest products
      }
    } catch (error) {
      console.error('Error fetching latest products:', error);
    } finally {
      setLoading(false);
    }
  };

  const ProductCard = ({ product }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardContent className="p-0">
        <Link href={`/product/${product.id}`}>
          <div className="relative overflow-hidden rounded-t-lg">
            <Image
              src={product.image || '/api/placeholder/300/250'}
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
  );

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
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
              <Zap className="w-4 h-4 mr-2" />
              Freshly Added
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Latest Products
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              Check out the newest additions to our marketplace.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-4 md:mt-0">
            <Link href="/shop">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))
          ) : (
            latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default LatestProducts;

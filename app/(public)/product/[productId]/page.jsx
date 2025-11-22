'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import PublicVoucherList from "@/components/vouchers/PublicVoucherList";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const products = useSelector(state => state.product.list);

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    useEffect(() => {
        if (productId) {
            const productFromState = products.find((p) => p.id === productId);
            if (productFromState) {
                setProduct(productFromState);
                // If minimal product (no store relation), fetch full details
                if (!productFromState.store) {
                    fetchProduct();
                }
            } else {
                fetchProduct();
            }
        }
        scrollTo(0, 0);
    }, [productId, products]);

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="  text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Vouchers */}
                {product && <PublicVoucherList productId={product.id} storeId={product.storeId} />}

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}
            </div>
        </div>
    );
}
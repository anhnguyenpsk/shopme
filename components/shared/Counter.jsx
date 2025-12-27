'use client'
import { addToCart, removeFromCart, setQuantity } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";

const Counter = ({ productId, variantId = null, maxQuantity = null, showInput = true, showStock = true }) => {

    const { cartItems } = useSelector(state => state.cart);
    const dispatch = useDispatch();

    const key = variantId ? `${productId}::${variantId}` : productId;
    const [inputValue, setInputValue] = useState(cartItems[key] || 0);
    const [error, setError] = useState('');

    useEffect(() => {
        setInputValue(cartItems[key] || 0);
    }, [cartItems, key]);

    const addToCartHandler = () => {
        const currentQty = cartItems[key] || 0;
        if (maxQuantity !== null && currentQty >= maxQuantity) {
            setError(`Chỉ còn ${maxQuantity} sản phẩm trong kho`);
            setTimeout(() => setError(''), 3000);
            return;
        }
        dispatch(addToCart({ productId, variantId }));
        setError('');
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId, variantId }));
        setError('');
    }

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
    }

    const handleInputBlur = () => {
        const value = inputValue.toString().trim();

        // Handle empty input
        if (value === '') {
            setInputValue(cartItems[key] || 0);
            return;
        }

        const qty = parseInt(value);

        if (isNaN(qty) || qty < 0) {
            setInputValue(cartItems[key] || 0);
            setError('Số lượng không hợp lệ');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (maxQuantity !== null && qty > maxQuantity) {
            setInputValue(maxQuantity);
            dispatch(setQuantity({ productId, variantId, quantity: maxQuantity }));
            setError(`Chỉ còn ${maxQuantity} sản phẩm trong kho`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        dispatch(setQuantity({ productId, variantId, quantity: qty }));
        setError('');
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    }

    return (
        <div className="flex flex-col gap-1.5 items-center">
            <div className="inline-flex items-center gap-0 rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden">
                <button
                    onClick={removeFromCartHandler}
                    className="px-3 py-2 select-none hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!cartItems[productId]}
                >
                    −
                </button>
                <div className="border-x border-slate-200">
                    {showInput ? (
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputValue}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleKeyDown}
                            className="w-14 sm:w-16 text-center py-2 px-2 border-0 focus:outline-none focus:ring-0 focus:bg-slate-50 transition-colors text-slate-800 font-medium"
                        />
                    ) : (
                        <p className="w-14 sm:w-16 text-center py-2 px-2 text-slate-800 font-medium">{cartItems[productId] || 0}</p>
                    )}
                </div>
                <button
                    onClick={addToCartHandler}
                    className="px-3 py-2 select-none hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={maxQuantity !== null && (cartItems[productId] || 0) >= maxQuantity}
                >
                    +
                </button>
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
            {showStock && maxQuantity !== null && !error && (
                <p className="text-xs text-slate-500">
                    {maxQuantity} có sẵn
                </p>
            )}
        </div>
    )
}

export default Counter
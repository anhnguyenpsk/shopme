import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId, variantId } = action.payload;
            const key = variantId ? `${productId}::${variantId}` : productId;

            if (state.cartItems[key]) {
                state.cartItems[key]++;
            } else {
                state.cartItems[key] = 1;
            }
            state.total += 1;
        },
        removeFromCart: (state, action) => {
            const { productId, variantId } = action.payload;
            const key = variantId ? `${productId}::${variantId}` : productId;

            if (state.cartItems[key]) {
                state.cartItems[key]--;
                if (state.cartItems[key] === 0) {
                    delete state.cartItems[key];
                }
            }
            state.total -= 1;
        },
        setQuantity: (state, action) => {
            const { productId, variantId, quantity } = action.payload;
            const key = variantId ? `${productId}::${variantId}` : productId;

            const oldQuantity = state.cartItems[key] || 0;

            if (quantity <= 0) {
                state.total -= oldQuantity;
                delete state.cartItems[key];
            } else {
                state.cartItems[key] = quantity;
                state.total = state.total - oldQuantity + quantity;
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId, variantId } = action.payload;
            const key = variantId ? `${productId}::${variantId}` : productId;

            state.total -= state.cartItems[key] ? state.cartItems[key] : 0;
            delete state.cartItems[key];
        },
        clearCart: (state) => {
            state.cartItems = {};
            state.total = 0;
        },
        loadCart: (state, action) => {
            const { cartItems, total } = action.payload;
            state.cartItems = cartItems || {};
            state.total = total || 0;
        },
        clearSelectedItems: (state, action) => {
            const { productIds } = action.payload;
            // productIds here might need to be keys if we select specific variants
            // But usually we select items in cart page.
            // If the cart page passes keys, we iterate keys.
            if (!Array.isArray(productIds)) return;

            productIds.forEach(key => {
                const quantity = state.cartItems[key] || 0;
                state.total -= quantity;
                delete state.cartItems[key];
            });
        },
    }
})

export const { addToCart, removeFromCart, setQuantity, clearCart, deleteItemFromCart, loadCart, clearSelectedItems } = cartSlice.actions

export default cartSlice.reducer

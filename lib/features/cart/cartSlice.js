import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
            }
            state.total -= 1
        },
        setQuantity: (state, action) => {
            const { productId, quantity } = action.payload
            const oldQuantity = state.cartItems[productId] || 0
            
            if (quantity <= 0) {
                // Remove item if quantity is 0 or negative
                state.total -= oldQuantity
                delete state.cartItems[productId]
            } else {
                // Update quantity
                state.cartItems[productId] = quantity
                state.total = state.total - oldQuantity + quantity
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
        loadCart: (state, action) => {
            const { cartItems, total } = action.payload
            state.cartItems = cartItems || {}
            state.total = total || 0
        },
        clearSelectedItems: (state, action) => {
            const { productIds } = action.payload
            if (!Array.isArray(productIds)) return
            
            productIds.forEach(productId => {
                const quantity = state.cartItems[productId] || 0
                state.total -= quantity
                delete state.cartItems[productId]
            })
        },
    }
})

export const { addToCart, removeFromCart, setQuantity, clearCart, deleteItemFromCart, loadCart, clearSelectedItems } = cartSlice.actions

export default cartSlice.reducer

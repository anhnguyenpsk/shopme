import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
    'product/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/api/products');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
        },
        addProduct: (state, action) => {
            state.list.push(action.payload)
        },
        updateProduct: (state, action) => {
            const { id, updates } = action.payload
            const index = state.list.findIndex(product => product.id === id)
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...updates }
            }
        },
        deleteProduct: (state, action) => {
            state.list = state.list.filter(product => product.id !== action.payload)
        },
        toggleProductStock: (state, action) => {
            const product = state.list.find(p => p.id === action.payload)
            if (product) {
                product.isActive = !product.isActive
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        clearProduct: (state) => {
            state.list = []
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
})

export const { 
    setProduct, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductStock,
    setLoading,
    setError,
    clearProduct 
} = productSlice.actions

export default productSlice.reducer

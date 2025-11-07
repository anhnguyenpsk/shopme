import { createSlice } from '@reduxjs/toolkit'

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        addresses: [],
        selectedAddress: null,
        loading: false,
        error: null,
    },
    reducers: {
        setAddresses: (state, action) => {
            state.addresses = action.payload
        },
        addAddress: (state, action) => {
            state.addresses.push(action.payload)
        },
        updateAddress: (state, action) => {
            const { id, updates } = action.payload
            const index = state.addresses.findIndex(addr => addr.id === id)
            if (index !== -1) {
                state.addresses[index] = { ...state.addresses[index], ...updates }
            }
        },
        deleteAddress: (state, action) => {
            state.addresses = state.addresses.filter(addr => addr.id !== action.payload)
        },
        setSelectedAddress: (state, action) => {
            state.selectedAddress = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        clearAddresses: (state) => {
            state.addresses = []
            state.selectedAddress = null
        }
    }
})

export const { 
    setAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setSelectedAddress,
    setLoading,
    setError,
    clearAddresses
} = addressSlice.actions

export default addressSlice.reducer

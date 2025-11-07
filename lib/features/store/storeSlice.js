import { createSlice } from '@reduxjs/toolkit'
import { dummyStoreData, orderDummyData } from '@/assets/assets'

const storeSlice = createSlice({
    name: 'store',
    initialState: {
        storeInfo: dummyStoreData,
        orders: orderDummyData,
        dashboardData: {
            totalProducts: 0,
            totalEarnings: 0,
            totalOrders: 0,
            ratings: [],
        },
        loading: false,
        error: null,
    },
    reducers: {
        setStoreInfo: (state, action) => {
            state.storeInfo = action.payload
        },
        updateStoreInfo: (state, action) => {
            state.storeInfo = { ...state.storeInfo, ...action.payload }
        },
        setOrders: (state, action) => {
            state.orders = action.payload
        },
        updateOrderStatus: (state, action) => {
            const { orderId, status } = action.payload
            const order = state.orders.find(o => o.id === orderId)
            if (order) {
                order.status = status
            }
        },
        addOrder: (state, action) => {
            state.orders.push(action.payload)
        },
        setDashboardData: (state, action) => {
            state.dashboardData = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        clearStore: (state) => {
            state.storeInfo = null
            state.orders = []
            state.dashboardData = {
                totalProducts: 0,
                totalEarnings: 0,
                totalOrders: 0,
                ratings: [],
            }
        }
    }
})

export const { 
    setStoreInfo,
    updateStoreInfo,
    setOrders,
    updateOrderStatus,
    addOrder,
    setDashboardData,
    setLoading,
    setError,
    clearStore
} = storeSlice.actions

export default storeSlice.reducer

import { createSlice } from '@reduxjs/toolkit'

const ratingSlice = createSlice({
    name: 'rating',
    initialState: {
        ratings: [],
        loading: false,
        error: null,
    },
    reducers: {
        setRatings: (state, action) => {
            state.ratings = action.payload
        },
        addRating: (state, action) => {
            state.ratings.push(action.payload)
        },
        updateRating: (state, action) => {
            const { id, updates } = action.payload
            const index = state.ratings.findIndex(rating => rating.id === id)
            if (index !== -1) {
                state.ratings[index] = { ...state.ratings[index], ...updates }
            }
        },
        deleteRating: (state, action) => {
            state.ratings = state.ratings.filter(rating => rating.id !== action.payload)
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        clearRatings: (state) => {
            state.ratings = []
        }
    }
})

export const { 
    setRatings,
    addRating,
    updateRating,
    deleteRating,
    setLoading,
    setError,
    clearRatings
} = ratingSlice.actions

export default ratingSlice.reducer

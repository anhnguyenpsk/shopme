'use client'

import { Star } from 'lucide-react';
import React, { useState } from 'react'
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const RatingModal = ({ ratingModal, setRatingModal, onRatingSubmitted }) => {

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) {
            toast.error('Please select a rating (1-5 stars)');
            return;
        }
        if (review.trim().length < 5) {
            toast.error('Review must be at least 5 characters');
            return;
        }

        if (!ratingModal?.productId || !ratingModal?.orderId) {
            toast.error('Missing product or order information');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating,
                    review: review.trim(),
                    productId: ratingModal.productId,
                    orderId: ratingModal.orderId
                })
            });

            if (res.ok) {
                toast.success('Thank you for your review!');
                if (onRatingSubmitted) {
                    onRatingSubmitted();
                }
                setRatingModal(null);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to submit rating');
            }
        } catch (error) {
            console.error('Rating submission error:', error);
            toast.error('An error occurred while submitting your rating');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='fixed inset-0 z-120 flex items-center justify-center bg-black/10 backdrop-blur-sm'>
            <div className='bg-white p-8 rounded-lg shadow-lg w-96 relative'>
                <button onClick={() => setRatingModal(null)} className='absolute top-3 right-3 text-gray-500 hover:text-gray-700'>
                    <XIcon size={20} />
                </button>
                <h2 className='text-xl font-medium text-slate-600 mb-2'>Rate Product</h2>
                {ratingModal?.productName && (
                    <p className='text-sm text-slate-500 mb-4'>"{ratingModal.productName}"</p>
                )}
                <div className='flex items-center justify-center mb-4'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-8 cursor-pointer ${rating > i ? "text-green-400 fill-current" : "text-gray-300"}`}
                            onClick={() => setRating(i + 1)}
                        />
                    ))}
                </div>
                <textarea
                    className='w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400'
                    placeholder='Write your review (minimum 5 characters)'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    )
}

export default RatingModal
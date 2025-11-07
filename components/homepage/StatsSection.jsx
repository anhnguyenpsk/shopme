import React from 'react'

const StatsSection = () => {
    return (
        <div className='mx-6'>
            <div className='max-w-7xl mx-auto'>
                <div className='flex items-center justify-start gap-16 py-8'>
                    <div className='text-center'>
                        <div className='text-3xl font-bold text-slate-900'>50K+</div>
                        <div className='text-sm text-slate-600'>Products</div>
                    </div>
                    <div className='text-center'>
                        <div className='text-3xl font-bold text-slate-900'>1K+</div>
                        <div className='text-sm text-slate-600'>Sellers</div>
                    </div>
                    <div className='text-center'>
                        <div className='text-3xl font-bold text-slate-900'>99%</div>
                        <div className='text-sm text-slate-600'>Satisfaction</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatsSection

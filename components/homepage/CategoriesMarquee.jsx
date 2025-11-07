'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { categories as fallbackCategories } from '@/assets/assets'

export default function CategoriesMarquee() {
  const router = useRouter()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let mounted = true
    fetch('/api/category')
      .then((res) => res.ok ? res.json() : { categories: [] })
      .then((data) => {
        if (!mounted) return
        // Store full category objects instead of just names
        const arr = Array.isArray(data?.categories) ? data.categories : []
        if (arr.length) setCategories(arr)
        else setCategories(fallbackCategories.map(name => ({ name, slug: name.toLowerCase() })))
      })
      .catch(() => mounted && setCategories(fallbackCategories.map(name => ({ name, slug: name.toLowerCase() }))))
    return () => { mounted = false }
  }, [])

  const items = categories?.length ? categories : fallbackCategories.map(name => ({ name, slug: name.toLowerCase() }))

  const onClickCategory = (category) => {
    // Use slug instead of name for the URL parameter
    const q = new URLSearchParams({ category: category.slug }).toString()
    router.push(`/shop?${q}`)
  }

  return (
    <section className="mx-6 my-10">
      <div className="max-w-7xl mx-auto overflow-hidden relative select-none group">
        <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
        <div className="flex min-w-[200%] animate-[marqueeScroll_10s_linear_infinite] sm:animate-[marqueeScroll_40s_linear_infinite] group-hover:[animation-play-state:paused] gap-4">
          {[...items, ...items, ...items, ...items].map((category, index) => (
            <button
              key={`${category.slug}-${index}`}
              onClick={() => onClickCategory(category)}
              className="px-5 py-2 bg-slate-100 rounded-lg text-slate-500 text-xs sm:text-sm hover:bg-slate-600 hover:text-white active:scale-95 transition-all duration-300"
              aria-label={`Filter by ${category.name}`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
      </div>
    </section>
  )
}


'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { categories as fallbackCategories } from '@/assets/assets'
import {
  Headphones,
  Speaker,
  Watch,
  Mouse,
  Palette,
  Laptop,
  Smartphone,
  Camera,
  Gamepad2,
  Cpu,
  Monitor,
  Zap
} from 'lucide-react'

const ICON_MAP = {
  'headphones': Headphones,
  'speakers': Speaker,
  'watch': Watch,
  'earbuds': Headphones,
  'mouse': Mouse,
  'decoration': Palette,
  'laptop': Laptop,
  'smartphone': Smartphone,
  'camera': Camera,
  'gaming': Gamepad2,
  'components': Cpu,
  'monitor': Monitor,
}

const getIcon = (name) => {
  const key = name.toLowerCase()
  for (const [k, Icon] of Object.entries(ICON_MAP)) {
    if (key.includes(k)) return Icon
  }
  return Zap
}

export default function CategoriesMarquee() {
  const router = useRouter()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let mounted = true
    fetch('/api/category')
      .then((res) => res.ok ? res.json() : { categories: [] })
      .then((data) => {
        if (!mounted) return
        const arr = Array.isArray(data?.categories) ? data.categories : []
        if (arr.length) setCategories(arr)
        else setCategories(fallbackCategories.map(name => ({ name, slug: name.toLowerCase() })))
      })
      .catch(() => mounted && setCategories(fallbackCategories.map(name => ({ name, slug: name.toLowerCase() }))))
    return () => { mounted = false }
  }, [])

  const items = categories?.length ? categories : fallbackCategories.map(name => ({ name, slug: name.toLowerCase() }))

  const onClickCategory = (category) => {
    const q = new URLSearchParams({ category: category.slug }).toString()
    router.push(`/shop?${q}`)
  }

  return (
    <section className="mx-6 my-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="h-6 w-1 bg-green-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Khám phá danh mục</h2>
        </div>

        <div className="relative overflow-hidden group py-4">
          {/* Fading Edges */}
          <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent" />
          <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent" />

          <div className="flex min-w-[200%] animate-[marqueeScroll_60s_linear_infinite] hover:[animation-play-state:paused] gap-6">
            {[...items, ...items, ...items, ...items].map((category, index) => {
              const Icon = getIcon(category.name)
              return (
                <button
                  key={`${category.slug}-${index}`}
                  onClick={() => onClickCategory(category)}
                  className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-green-200 hover:-translate-y-1 group/item"
                >
                  <div className="p-2 bg-slate-50 rounded-xl group-hover/item:bg-green-50 transition-colors">
                    <Icon size={20} className="text-slate-600 group-hover/item:text-green-600 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap group-hover/item:text-green-700">
                    {category.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}


'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Categories() {
  const [items, setItems] = useState([])

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch('/api/category')
        const data = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(data?.categories)) setItems(data.categories)
      } catch (e) {}
    }
    run()
  }, [])

  if (!items.length) return null

  return (
    <section className="mx-6 my-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Explore Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((c) => (
            <Link key={c.id} href={`/shop?category=${encodeURIComponent(c.slug)}`} className="group border border-slate-200 rounded-lg p-4 hover:shadow-sm hover:border-slate-300 transition text-center">
              <div className="text-slate-800 font-medium group-hover:text-slate-900 truncate">{c.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}


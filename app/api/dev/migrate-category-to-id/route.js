import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST() {
  try {
    // The legacy column `Product.category` has been dropped from the schema.
    // If you still need to migrate data, restore a backup that contains the column
    // and run the migration before dropping the column.
    return NextResponse.json({ ok: true, migrated: 0, note: 'Legacy Product.category column is removed; nothing to migrate.' })
  } catch (err) {
    console.error('migrate-category-to-id error', err)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}


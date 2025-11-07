import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const ext = path.extname(file.name || '') || '.jpg'
    const unique = crypto.randomBytes(16).toString('hex') + ext.toLowerCase()
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    await mkdir(uploadDir, { recursive: true })
    const fullPath = path.join(uploadDir, unique)

    await writeFile(fullPath, buffer)

    const publicPath = `/uploads/products/${unique}`
    return NextResponse.json({ path: publicPath }, { status: 200 })
  } catch (err) {
    console.error('Upload error', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


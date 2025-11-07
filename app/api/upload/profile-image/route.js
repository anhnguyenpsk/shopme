import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image (JPG, PNG, GIF, WEBP)' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const ext = file.name.split('.').pop();
    const filename = `${session.user.id}-${Date.now()}.${ext}`;
    const filepath = join(process.cwd(), 'public', 'uploads', 'profiles', filename);

    // Delete old profile image if exists
    const oldImagePath = formData.get('oldImage');
    if (oldImagePath && oldImagePath.startsWith('/uploads/profiles/')) {
      const oldFilePath = join(process.cwd(), 'public', oldImagePath);
      if (existsSync(oldFilePath)) {
        try {
          await unlink(oldFilePath);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
    }

    // Write new file
    await writeFile(filepath, buffer);

    const publicPath = `/uploads/profiles/${filename}`;

    return NextResponse.json({ 
      success: true,
      imagePath: publicPath 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

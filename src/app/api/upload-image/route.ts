
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Hardcoded for reliability across environments
cloudinary.config({
  cloud_name: 'duaitkk9w',
  api_key: '619633159437743',
  api_secret: 'ooKCEhQaaycRKeDzP60GfDIyf7A'
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'relox_profiles',
    });

    return NextResponse.json({ secure_url: result.secure_url });
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

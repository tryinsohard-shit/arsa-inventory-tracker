import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { fileId } = await request.json();

    console.log('Delete request received:', { fileId });

    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
      console.error('Missing ImageKit environment variables');
      return NextResponse.json({ error: 'Missing ImageKit environment variables' }, { status: 500 });
    }

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Create authorization header using private key
    const credentials = `${process.env.IMAGEKIT_PRIVATE_KEY}:`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    // Delete file directly via ImageKit API
    const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Deletion failed with status ${response.status}: ${errorData}`);
    }

    console.log('Delete successful:', { fileId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('ImageKit delete error:', error);
    console.error('Error details:', error.message || error);
    return NextResponse.json({ error: `Deletion failed: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
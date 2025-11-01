import { NextRequest, NextResponse } from 'next/server';
import { getUploadAuthParams } from '@imagekit/next/server';

export async function POST(request: NextRequest) {
  try {
    const { file, fileName } = await request.json();

    console.log('Upload request received:', { fileName, fileLength: file?.length });

    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
      console.error('Missing ImageKit environment variables');
      return NextResponse.json({ error: 'Missing ImageKit environment variables' }, { status: 500 });
    }

    if (!file || !fileName) {
      return NextResponse.json({ error: 'File and fileName are required' }, { status: 400 });
    }

    // Validate and clean the base64 string
    let cleanBase64 = file;
    
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    if (file.includes(',')) {
      cleanBase64 = file.split(',')[1];
      console.log('Removed data URL prefix from base64 string');
    }
    
    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      console.error('Invalid base64 format detected');
      return NextResponse.json({ error: 'Invalid base64 format' }, { status: 400 });
    }
    
    console.log('Base64 validation passed, length:', cleanBase64.length);

    // Create authentication parameters
    const { token, expire, signature } = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    });

    // Create a unique filename with inventory tracker prefix to keep it organized
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${fileName}`;

    console.log('Attempting to upload to ImageKit:', { uniqueFileName });

    // Determine MIME type from file extension
    const getMimeType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
      };
      return mimeTypes[ext] || 'image/jpeg';
    };

    // ImageKit Upload API v1 expects multipart/form-data, not JSON
    // Convert base64 to buffer and create FormData
    const base64Buffer = Buffer.from(cleanBase64, 'base64');
    const mimeType = getMimeType(fileName);
    
    // Create FormData for multipart upload
    const formData = new FormData();
    
    // Create a File-like object from buffer (Node.js 18+ supports this)
    const fileBlob = new File([base64Buffer], uniqueFileName, { type: mimeType });
    
    formData.append('file', fileBlob);
    formData.append('fileName', uniqueFileName);
    formData.append('folder', '/arsa-inventory');
    formData.append('useUniqueFileName', 'false');
    formData.append('signature', signature);
    formData.append('token', token);
    formData.append('expire', expire.toString());
    formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!);

    console.log('Upload payload prepared (FormData):', { 
      fileName: uniqueFileName, 
      folder: '/arsa-inventory',
      mimeType: mimeType,
      fileSize: base64Buffer.length,
      expire: expire,
      token: token?.substring(0, 10) + '...',
      signature: signature?.substring(0, 10) + '...',
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.substring(0, 10) + '...'
    });

    // Upload directly to ImageKit via their API using multipart/form-data
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData, // No Content-Type header - let fetch set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Upload response error:', errorData);
      throw new Error(`Upload failed with status ${response.status}: ${errorData}`);
    }

    const result = await response.json();

    console.log('Upload successful:', { 
      fileId: result.fileId, 
      url: result.url,
      fullResponse: result 
    });

    // Ensure we have a proper URL for display
    const displayUrl = result.url;
    
    // Log the final URL that will be used for display
    console.log('Final display URL:', displayUrl);

    return NextResponse.json({ 
      url: displayUrl,
      fileId: result.fileId 
    });
  } catch (error: any) {
    console.error('ImageKit upload error:', error);
    console.error('Error details:', error.message || error);

    return NextResponse.json({ error: `Upload failed: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
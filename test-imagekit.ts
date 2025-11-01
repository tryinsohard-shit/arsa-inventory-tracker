// Test file to check ImageKit implementation
import ImageKit from '@imagekit/nodejs';

// Create ImageKit instance
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || 'test_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'test_private_key',
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/test',
});

console.log('ImageKit instance created');
console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(imagekit)));

// Check if upload method exists
console.log('Upload method exists:', typeof imagekit.upload === 'function');
console.log('DeleteFile method exists:', typeof imagekit.deleteFile === 'function');
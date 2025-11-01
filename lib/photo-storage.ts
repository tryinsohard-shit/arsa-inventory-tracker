import { dataStore } from "./data-store";

/**
 * Upload a photo to ImageKit
 * @param file The image file to upload
 * @param fileName The name to give the file (will be prefixed with unique ID)
 * @param onProgress Optional callback to track upload progress
 * @returns The URL of the uploaded photo
 */
export async function uploadInventoryPhoto(file: File, fileName: string, onProgress?: (progress: number) => void): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (limit to 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Check if user is authenticated via our custom auth system
  const currentUser = dataStore.getCurrentUser();
  if (!currentUser) {
    throw new Error("Auth session missing! User needs to be logged in to upload photos.");
  }

  // Simulate progress
  if (onProgress) {
    onProgress(25);
  }

  // Convert file to base64
  const fileReader = new FileReader();
  const base64Promise = new Promise<string>((resolve, reject) => {
    fileReader.onload = () => {
      resolve(fileReader.result as string);
    };
    fileReader.onerror = (error) => {
      reject(error);
    };
    fileReader.readAsDataURL(file);
  });

  try {
    const base64 = await base64Promise;
    // Remove data URL prefix to get just the base64 string
    const base64Data = base64.split(',')[1];

    if (onProgress) {
      onProgress(50);
    }

    // Upload to ImageKit via API route
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: JSON.stringify({
        file: base64Data,
        fileName: fileName,
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();

    if (onProgress) {
      onProgress(100);
    }

    // Return just the URL for compatibility with existing code
    return result.url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * Delete a photo from ImageKit
 * @param fileId The file ID of the photo to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteInventoryPhoto(fileId: string): Promise<boolean> {
  // Check if user is authenticated via our custom auth system
  const currentUser = dataStore.getCurrentUser();
  if (!currentUser) {
    throw new Error("Auth session missing! User needs to be logged in to delete photos.");
  }
  
  try {
    const response = await fetch('/api/delete-image', {
      method: 'DELETE',
      body: JSON.stringify({ fileId }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

/**
 * Setup function (not needed for ImageKit since there's no bucket to create)
 */
export async function setupInventoryPhotos(): Promise<void> {
  // ImageKit doesn't require setup like Supabase storage
  console.log('ImageKit ready for inventory photos');
}
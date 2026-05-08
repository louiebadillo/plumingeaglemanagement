import { supabase } from '../lib/supabase';

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} clientId - The client ID
 * @param {string} category - The file category (appointments, bir, awol, injury)
 * @param {string} date - The report date (YYYY-MM-DD)
 * @returns {Promise<{url: string, name: string, uploadedAt: string}>}
 */
export async function uploadFile(file, clientId, category, date) {
  try {
    console.log('🔍 Upload attempt:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      clientId, 
      category, 
      date 
    });

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Please upload PDF, JPG, PNG, DOC, or DOCX files only.');
    }

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name}`;
    
    // Create file path
    const filePath = `client-${clientId}/${category}/${date}/${fileName}`;
    
    // Map category to correct bucket name
    const bucketMapping = {
      'appointments': 'appointment-files',
      'awol': 'awol-files',
      'injury': 'injury-files',
      'bir': 'bir-files',
      'general': 'general-files'
    };
    const bucketName = bucketMapping[category] || `${category}-files`;
    
    console.log('🔍 Upload details:', { 
      filePath, 
      category,
      bucketName,
      supabaseUrl: supabase.supabaseUrl 
    });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Current user:', user);
    console.log('🔍 Auth error:', authError);
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated. Please log in again.');
    }

    // Try to access storage directly without listing buckets first
    console.log('🔍 Attempting direct upload to bucket:', bucketName);
    
    // First, let's try to upload directly and see what error we get
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    console.log('🔍 Direct upload result:', { uploadData, uploadError });

    if (uploadError) {
      console.error('🔍 Upload error details:', uploadError);
      
      // If upload fails, try to list buckets to see what's available
      console.log('🔍 Upload failed, checking available buckets...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('🔍 Available buckets:', buckets);
      console.log('🔍 Buckets error:', bucketsError);
      
      if (bucketsError) {
        throw new Error(`Storage access error: ${bucketsError.message}`);
      }
      
      if (!buckets || buckets.length === 0) {
        throw new Error(`No buckets found. Please check if buckets were created in Supabase Dashboard.`);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      if (!bucketExists) {
        throw new Error(`Bucket '${bucketName}' not found. Available buckets: ${buckets?.map(b => b.name).join(', ')}`);
      }
      
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('🔍 Upload successful!');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('🔍 Public URL:', urlData);

    return {
      url: urlData.publicUrl,
      name: file.name,
      uploadedAt: new Date().toISOString(),
      path: filePath
    };

  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The file path in storage
 * @param {string} category - The file category
 * @returns {Promise<boolean>}
 */
export async function deleteFile(filePath, category) {
  try {
    // Map category to correct bucket name
    const bucketMapping = {
      'appointments': 'appointment-files',
      'awol': 'awol-files',
      'injury': 'injury-files',
      'bir': 'bir-files',
      'general': 'general-files'
    };
    const bucketName = bucketMapping[category] || `${category}-files`;
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
}

/**
 * Get a signed URL for file download
 * @param {string} filePath - The file path in storage
 * @param {string} category - The file category
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>}
 */
export async function getFileUrl(filePath, category, expiresIn = 3600) {
  try {
    // Map category to correct bucket name
    const bucketMapping = {
      'appointments': 'appointment-files',
      'awol': 'awol-files',
      'injury': 'injury-files',
      'bir': 'bir-files',
      'general': 'general-files'
    };
    const bucketName = bucketMapping[category] || `${category}-files`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Get file URL error:', error);
    throw error;
  }
}

/**
 * Get all files for a client in a specific category and date
 * @param {string} clientId - The client ID
 * @param {string} category - The file category
 * @param {string} date - The report date
 * @returns {Promise<Array>}
 */
export async function getClientFiles(clientId, category, date) {
  try {
    // Map category to correct bucket name
    const bucketName = category === 'appointments' ? 'appointment-files' : `${category}-files`;
    const folderPath = `client-${clientId}/${category}/${date}`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    if (error) {
      console.error('List files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }

    // Transform the data to include additional metadata
    const files = (data || []).map(file => ({
      name: file.name,
      size: file.metadata?.size || 0,
      uploadedAt: file.created_at,
      path: `${folderPath}/${file.name}`,
      category: category,
      url: null // Will be generated when needed
    }));

    return files;
  } catch (error) {
    console.error('Get client files error:', error);
    throw error;
  }
}

/**
 * Download a file from Supabase Storage
 * @param {string} filePath - The file path in storage
 * @param {string} category - The file category
 * @returns {Promise<Blob>}
 */
export async function downloadFile(filePath, category) {
  try {
    // Map category to correct bucket name
    const bucketMapping = {
      'appointments': 'appointment-files',
      'awol': 'awol-files',
      'injury': 'injury-files',
      'bir': 'bir-files',
      'general': 'general-files'
    };
    const bucketName = bucketMapping[category] || `${category}-files`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Download file error:', error);
    throw error;
  }
}

/**
 * Compress and resize an image file
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default: 800)
 * @param {number} maxHeight - Maximum height in pixels (default: 800)
 * @param {number} quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<File>}
 */
export function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    // Only compress image files
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Upload a profile photo for a client (private bucket)
 * @param {File} file - The image file to upload
 * @param {string} clientId - The client ID
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadProfilePhoto(file, clientId) {
  try {
    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Please upload JPG, PNG, or WEBP images only.');
    }

    // Compress image before upload (max 800x800, 80% quality)
    const compressedFile = await compressImage(file, 800, 800, 0.8);
    
    console.log('📸 Profile photo upload:', {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      reduction: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
    });

    // Validate file size after compression (5MB limit for profile photos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (compressedFile.size > maxSize) {
      throw new Error('File size must be less than 5MB after compression. Please use a smaller image.');
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = compressedFile.name.split('.').pop() || 'jpg';
    const fileName = `profile-${timestamp}.${fileExtension}`;
    
    // Create file path in profile-photos bucket
    const filePath = `client-${clientId}/${fileName}`;
    const bucketName = 'profile-photos';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated. Please log in again.');
    }

    // Delete old profile photo if it exists
    try {
      const { data: existingFiles } = await supabase.storage
        .from(bucketName)
        .list(`client-${clientId}`, {
          search: 'profile-'
        });
      
      if (existingFiles && existingFiles.length > 0) {
        const oldFiles = existingFiles.map(f => `client-${clientId}/${f.name}`);
        await supabase.storage
          .from(bucketName)
          .remove(oldFiles);
      }
    } catch (error) {
      // Ignore errors when deleting old files
      console.log('No old profile photos to delete or error deleting:', error);
    }

    // Upload to Supabase Storage (private bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: true // Overwrite if exists
      });

    if (uploadError) {
      // If bucket doesn't exist, provide helpful error
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('The resource was not found')) {
        throw new Error(`Storage bucket '${bucketName}' not found. Please create it in Supabase Dashboard → Storage.`);
      }
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // For private buckets, we store the path and generate signed URLs when needed
    // Return the path instead of a public URL
    return {
      url: filePath, // Store path, not public URL
      path: filePath
    };

  } catch (error) {
    console.error('Profile photo upload error:', error);
    throw error;
  }
}

/**
 * Get a signed URL for a profile photo (for private bucket)
 * @param {string} filePath - The file path in storage
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string|null>}
 */
export async function getProfilePhotoUrl(filePath, expiresIn = 3600) {
  try {
    const bucketName = 'profile-photos';
    const originalPath = typeof filePath === 'string' ? filePath : String(filePath || '');
    if (!originalPath || originalPath.startsWith('blob:')) {
      return null;
    }
    
    // If filePath is already a full URL, extract the path
    let path = originalPath;
    if (originalPath.includes('/storage/v1/object/public/')) {
      // Extract path from public URL
      const urlParts = originalPath.split('/profile-photos/');
      if (urlParts.length > 1) {
        path = urlParts[1];
      }
    } else if (originalPath.startsWith('http')) {
      // Extract path from signed URL or other URL formats
      const urlParts = originalPath.split('/profile-photos/');
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0]; // Remove query params
      }
    }

    // Avoid noisy 400 "Object not found" errors for stale DB values by
    // checking the folder first. This happens when a client row points to a
    // profile photo path that was never uploaded or was later removed.
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash > 0) {
      const folder = path.slice(0, lastSlash);
      const fileName = path.slice(lastSlash + 1);
      const { data: existingFiles, error: listError } = await supabase.storage
        .from(bucketName)
        .list(folder, { search: fileName, limit: 1 });

      if (!listError) {
        const fileExists = (existingFiles || []).some((file) => file.name === fileName);
        if (!fileExists) return null;
      }
    }
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      if (error.message?.includes('Object not found')) return null;
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a profile photo from Supabase Storage
 * @param {string} filePath - The file path in storage
 * @returns {Promise<boolean>}
 */
export async function deleteProfilePhoto(filePath) {
  try {
    const bucketName = 'profile-photos';
    
    // Extract path if it's a URL
    let path = filePath;
    if (filePath.includes('/storage/v1/object/public/') || filePath.includes('/storage/v1/object/sign/')) {
      const urlParts = filePath.split('/profile-photos/');
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0]; // Remove query params
      }
    }
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      console.error('Delete profile photo error:', error);
      throw new Error(`Failed to delete profile photo: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Delete profile photo error:', error);
    throw error;
  }
}

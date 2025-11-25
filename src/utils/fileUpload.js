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

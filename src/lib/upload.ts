export const uploadImagesToSupabase = async (
  supabase: any,
  images: any[],
  bucket: string = 'audit_images',
  folder: string = 'audit'
): Promise<string[]> => {
  const urls: string[] = [];
  if (!Array.isArray(images) || images.length === 0) return urls;
  
  for (const img of images) {
    if (!img) continue;

    // 1. If it's a direct string URL (e.g. Supabase storage URL or data URL)
    if (typeof img === 'string') {
      if (img.trim().length > 0) urls.push(img.trim());
      continue;
    }

    // 2. Extract potential File / Blob
    const file = img.file instanceof File || img.file instanceof Blob
      ? img.file
      : (img instanceof File || img instanceof Blob ? img : null);

    // 3. Extract potential existing URL
    const existingUrl = typeof img.url === 'string'
      ? img.url
      : (typeof img.file?.url === 'string' ? img.file.url : null);

    // 4. If there is an existing remote/uploaded URL and no new File to upload, keep the existing URL
    if (!file && existingUrl) {
      if (existingUrl.trim().length > 0) urls.push(existingUrl.trim());
      continue;
    }

    // 5. If there is a new File object, upload it
    if (file) {
      const extension = file.name ? file.name.split('.').pop() || 'webp' : 'webp';
      const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      const { error } = await supabase.storage.from(bucket).upload(filename, file, {
        contentType: file.type || 'image/webp',
        cacheControl: '3600',
        upsert: false
      });
      
      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
        if (data && data.publicUrl) {
          urls.push(data.publicUrl);
        }
      } else {
        console.error("Upload failed", error);
        // If upload failed, but an existing URL was present, preserve the existing URL
        if (existingUrl) {
          urls.push(existingUrl);
        } else if (error.message && error.message.toLowerCase().includes('bucket not found')) {
          throw new Error(`Bucket '${bucket}' tidak ditemukan. Silakan buat bucket public bernama '${bucket}' di menu Storage Supabase.`);
        } else {
          throw error;
        }
      }
    }
  }
  
  return urls;
};


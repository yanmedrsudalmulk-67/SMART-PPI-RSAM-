export const uploadImagesToSupabase = async (supabase: any, images: { file: File }[], bucket: string, folder: string) => {
  const urls: string[] = [];
  
  for (const img of images) {
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(filename, img.file, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    });
    
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
      if (data) {
        urls.push(data.publicUrl);
      }
    } else {
        console.error("Upload failed", error);
        if (error.message && error.message.toLowerCase().includes('bucket not found')) {
            throw new Error(`Bucket '${bucket}' tidak ditemukan. Silakan buat bucket public bernama '${bucket}' di menu Storage Supabase.`);
        }
        throw error;
    }
  }
  
  return urls;
};

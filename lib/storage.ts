import { supabase } from './supabase'

const BUCKET_NAME = 'shipsync-documents'

export async function uploadFile(file: Buffer, key: string, contentType: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, file, { contentType, upsert: true })

  if (error) throw error

  // Default to secure time-limited signed URL (1 hour)
  try {
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(key, 3600);

    if (!signError && signedData?.signedUrl) {
      return signedData.signedUrl;
    }
  } catch {
    // Fall back to getPublicUrl if sign fails in local/test environment
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key)

  return urlData.publicUrl
}

export async function getSignedDownloadUrl(key: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(key, 3600);

  if (error) throw error;
  return data.signedUrl;
}

export async function createSignedUploadUrl(key: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(key);

  if (error) throw error;
  return data;
}
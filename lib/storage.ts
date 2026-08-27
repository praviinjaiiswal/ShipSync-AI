import { supabase } from './supabase'

const BUCKET_NAME = 'shipsync-documents'

export async function uploadFile(file: Buffer, key: string, contentType: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, file, { contentType, upsert: true })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key)

  return urlData.publicUrl
}

export async function getSignedDownloadUrl(key: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(key, 3600)

  if (error) throw error
  return data.signedUrl
}
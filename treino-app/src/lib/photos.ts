import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

import { supabase } from '../state/supabase';
import { progressPhotos$ } from '../state/store';
import { newId } from './ids';

const BUCKET = 'progress-photos';

export interface UploadResult {
  ok: boolean;
  error?: string;
}

/**
 * Escolhe uma foto da galeria, comprime (~1080px, q0.7), envia para o Storage
 * privado sob {userId}/{id}.jpg e grava o metadado em progress_photos.
 */
export async function pickAndUploadPhoto(pose: string | null): Promise<UploadResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, error: 'Permissão de fotos negada.' };

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (res.canceled || !res.assets?.[0]) return { ok: false };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: 'Sem sessão ativa.' };

  // Compressão antes do upload (economiza o free tier de 1GB).
  const out = await manipulateAsync(res.assets[0].uri, [{ resize: { width: 1080 } }], {
    compress: 0.7,
    format: SaveFormat.JPEG,
  });

  const photoId = newId();
  const path = `${userId}/${photoId}.jpg`;
  const bytes = await new File(out.uri).bytes();

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };

  progressPhotos$[photoId].set({
    id: photoId,
    storage_path: path,
    pose,
    taken_at: new Date().toISOString(),
    notes: null,
  } as never);

  return { ok: true };
}

/** URL assinada temporária para exibir uma foto privada. */
export async function getSignedPhotoUrl(path: string, expiresInSec = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSec);
  return data?.signedUrl ?? null;
}

/** Remove a foto (soft-delete do metadado + apaga o binário do Storage). */
export async function deletePhoto(photoId: string, path: string): Promise<void> {
  progressPhotos$[photoId].deleted.set(true);
  await supabase.storage.from(BUCKET).remove([path]);
}

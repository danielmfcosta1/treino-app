import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Escreve `content` num arquivo no cache e abre a folha de compartilhamento.
 * Retorna false se o sharing não estiver disponível na plataforma.
 */
export async function shareTextFile(
  filename: string,
  content: string,
  mimeType: string,
): Promise<boolean> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType, UTI: mimeType === 'application/json' ? 'public.json' : 'public.comma-separated-values-text' });
  return true;
}

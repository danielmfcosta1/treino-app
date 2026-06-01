import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { use$ } from '@legendapp/state/react';

import { progressPhotos$ } from '../state/store';
import { deletePhoto, getSignedPhotoUrl, pickAndUploadPhoto } from '../lib/photos';
import type { ProgressPhotoRow } from '../domain/types';

function PhotoThumb({ photo }: { photo: ProgressPhotoRow }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSignedPhotoUrl(photo.storage_path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [photo.storage_path]);

  const confirmDelete = () => {
    Alert.alert('Excluir foto', 'Remover esta foto de progresso?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deletePhoto(photo.id, photo.storage_path) },
    ]);
  };

  return (
    <TouchableOpacity style={s.thumb} onLongPress={confirmDelete}>
      {url ? (
        <Image source={{ uri: url }} style={s.thumbImg} />
      ) : (
        <View style={[s.thumbImg, s.thumbLoading]}>
          <ActivityIndicator color="#555" />
        </View>
      )}
      <Text style={s.thumbDate}>
        {new Date(photo.taken_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
      </Text>
    </TouchableOpacity>
  );
}

export function ProgressPhotos() {
  const photosMap = use$(progressPhotos$) ?? {};
  const [busy, setBusy] = useState(false);

  const photos = Object.values(photosMap)
    .filter((p): p is ProgressPhotoRow => !!p && !p.deleted)
    .sort((a, b) => b.taken_at.localeCompare(a.taken_at));

  const addPhoto = async () => {
    setBusy(true);
    const r = await pickAndUploadPhoto(null);
    setBusy(false);
    if (!r.ok && r.error) Alert.alert('Erro', r.error);
  };

  return (
    <View style={s.section}>
      <View style={s.head}>
        <Text style={s.title}>Fotos de progresso</Text>
        <TouchableOpacity style={s.addBtn} onPress={addPhoto} disabled={busy}>
          <Text style={s.addBtnText}>{busy ? 'Enviando…' : '+ Foto'}</Text>
        </TouchableOpacity>
      </View>
      {photos.length === 0 ? (
        <Text style={s.empty}>Nenhuma foto ainda. Toque longo para excluir.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {photos.map((p) => (
            <PhotoThumb key={p.id} photo={p} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600', color: '#aaa' },
  addBtn: { backgroundColor: '#1f3a52', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#7fb3e0', fontSize: 13, fontWeight: '600' },
  empty: { color: '#555', fontSize: 14, paddingVertical: 8 },
  row: { gap: 10, paddingVertical: 4 },
  thumb: { width: 110, gap: 4 },
  thumbImg: { width: 110, height: 150, borderRadius: 12, backgroundColor: '#1a1a1a' },
  thumbLoading: { alignItems: 'center', justifyContent: 'center' },
  thumbDate: { color: '#666', fontSize: 11, textAlign: 'center' },
});

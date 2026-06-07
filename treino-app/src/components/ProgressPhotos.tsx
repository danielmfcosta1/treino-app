import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { use$ } from '@legendapp/state/react';

import { progressPhotos$ } from '../state/store';
import { deletePhoto, getSignedPhotoUrl, pickAndUploadPhoto } from '../lib/photos';
import type { ProgressPhotoRow } from '../domain/types';
import { useColors, type ThemeColors } from '../lib/theme';

function PhotoThumb({ photo }: { photo: ProgressPhotoRow }) {
  const c = useColors();
  const styles = makeStyles(c);
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
    <TouchableOpacity style={styles.thumb} onLongPress={confirmDelete}>
      {url ? (
        <Image source={{ uri: url }} style={styles.thumbImg} />
      ) : (
        <View style={[styles.thumbImg, styles.thumbLoading]}>
          <ActivityIndicator color={c.textFaint} />
        </View>
      )}
      <Text style={styles.thumbDate}>
        {new Date(photo.taken_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
      </Text>
    </TouchableOpacity>
  );
}

export function ProgressPhotos() {
  const c = useColors();
  const styles = makeStyles(c);
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
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Fotos de progresso</Text>
        <TouchableOpacity style={styles.addBtn} onPress={addPhoto} disabled={busy}>
          <Text style={styles.addBtnText}>{busy ? 'Enviando…' : '+ Foto'}</Text>
        </TouchableOpacity>
      </View>
      {photos.length === 0 ? (
        <Text style={styles.empty}>Nenhuma foto ainda. Toque longo para excluir.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {photos.map((p) => (
            <PhotoThumb key={p.id} photo={p} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    section: { gap: 12 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: 16, fontWeight: '600', color: c.textDim },
    addBtn: { backgroundColor: c.accentBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    addBtnText: { color: c.accentSoft, fontSize: 13, fontWeight: '600' },
    empty: { color: c.textFaint, fontSize: 14, paddingVertical: 8 },
    row: { gap: 10, paddingVertical: 4 },
    thumb: { width: 110, gap: 4 },
    thumbImg: { width: 110, height: 150, borderRadius: 12, backgroundColor: c.surface },
    thumbLoading: { alignItems: 'center', justifyContent: 'center' },
    thumbDate: { color: c.textDim, fontSize: 11, textAlign: 'center' },
  });

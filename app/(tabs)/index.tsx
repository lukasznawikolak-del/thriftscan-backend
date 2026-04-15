import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const BACKEND_URL = 'http://TWOJE_IP:8000';

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wyniki, setWyniki] = useState<any[]>([]);
  const [opis, setOpis] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState('');

  const wybierzZdjecie = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Brak dostępu', 'Potrzebujemy dostępu do zdjęć');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setWyniki([]);
      setStats(null);
      setOpis('');
    }
  };

  const zrobZdjecie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Brak dostępu', 'Potrzebujemy dostępu do kamery');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setWyniki([]);
      setStats(null);
      setOpis('');
    }
  };

  const skanuj = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      const resp = await axios.post(`${BACKEND_URL}/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      setWyniki(resp.data.results || []);
      setOpis(resp.data.opis || '');
      setStats(resp.data.stats || null);
      setQuery(resp.data.query || '');
    } catch (e: any) {
      Alert.alert('Błąd', 'Nie można połączyć się z serwerem. Sprawdź czy backend działa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>ThriftScan</Text>
        <Text style={styles.subtitle}>Sprawdź za ile sprzedasz znalezisko</Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btnSecondary} onPress={wybierzZdjecie}>
          <Text style={styles.btnSecondaryText}>📁 Galeria</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={zrobZdjecie}>
          <Text style={styles.btnPrimaryText}>📸 Kamera</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity
            style={[styles.btnScan, loading && styles.btnDisabled]}
            onPress={skanuj}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnScanText}>🔍 Szukaj cen na Vinted</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {opis !== '' && (
        <View style={styles.opisBox}>
          <Text style={styles.opisLabel}>AI rozpoznało:</Text>
          <Text style={styles.opisText}>{opis}</Text>
          {query !== '' && (
            <Text style={styles.queryText}>Szukano: „{query}"</Text>
          )}
        </View>
      )}

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Najniższa</Text>
            <Text style={styles.statValue}>{stats.min} zł</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Średnia</Text>
            <Text style={[styles.statValue, { color: '#534AB7' }]}>{stats.avg} zł</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Najwyższa</Text>
            <Text style={styles.statValue}>{stats.max} zł</Text>
          </View>
        </View>
      )}

      {wyniki.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Oferty na Vinted ({wyniki.length})</Text>
          {wyniki.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.card}
              onPress={() => Linking.openURL(item.url)}
            >
              <View style={styles.cardRow}>
                {item.photo && (
                  <Image source={{ uri: item.photo }} style={styles.cardImage} />
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.cardMeta}>
                    {item.brand !== '' && (
                      <Text style={styles.cardBrand}>{item.brand}</Text>
                    )}
                    {item.size !== '' && (
                      <Text style={styles.cardSize}>{item.size}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.cardPrice}>{item.price} zł</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!image && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👕</Text>
          <Text style={styles.emptyText}>
            Zrób zdjęcie ubrania z lumpeksu{'\n'}i sprawdź za ile możesz je sprzedać
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24, marginTop: 20 },
  logo: { fontSize: 32, fontWeight: '700', color: '#534AB7' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnPrimary: {
    flex: 1, backgroundColor: '#534AB7', padding: 14,
    borderRadius: 12, alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnSecondary: {
    flex: 1, backgroundColor: '#fff', padding: 14,
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd',
  },
  btnSecondaryText: { color: '#534AB7', fontWeight: '600', fontSize: 15 },
  imageContainer: { marginBottom: 16 },
  image: { width: '100%', height: 260, borderRadius: 16, marginBottom: 12 },
  btnScan: {
    backgroundColor: '#09B67D', padding: 16,
    borderRadius: 12, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnScanText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  opisBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#e8e6ff',
  },
  opisLabel: { fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  opisText: { fontSize: 15, color: '#333', fontWeight: '500' },
  queryText: { fontSize: 12, color: '#aaa', marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#eee',
  },
  statLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#222' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#eee',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardImage: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f0f0f0' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 13, color: '#333', fontWeight: '500' },
  cardMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  cardBrand: {
    fontSize: 11, color: '#534AB7', backgroundColor: '#EEEDFE',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  cardSize: {
    fontSize: 11, color: '#555', backgroundColor: '#f0f0f0',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  cardPrice: { fontSize: 18, fontWeight: '700', color: '#09B67D' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },
});

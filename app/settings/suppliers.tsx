import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { getSuppliers, addSupplier, deleteSupplier } from '@/lib/db';
import { Supplier } from '@/types';

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setSuppliers(await getSuppliers());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function resetForm() {
    setName(''); setPhone(''); setEmail(''); setAddress(''); setShowForm(false);
  }

  async function handleAdd() {
    if (!name.trim()) return Alert.alert('Name required', 'Please enter a supplier name.');
    setSaving(true);
    try {
      const created = await addSupplier({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      setSuppliers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      resetForm();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add supplier');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string, supplierName: string) {
    Alert.alert('Delete Supplier', `Delete "${supplierName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSupplier(id);
          setSuppliers(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Suppliers</Text>
        <TouchableOpacity onPress={() => setShowForm(v => !v)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color={COLORS.accentCyan} />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Supplier name *"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor={COLORS.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor={COLORS.textMuted}
            value={address}
            onChangeText={setAddress}
          />
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleAdd} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.textInverse} /> : <Text style={styles.saveBtnText}>Add Supplier</Text>}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={suppliers}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="business-outline" size={20} color={COLORS.accentCyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              {(item.phone || item.email) && (
                <Text style={styles.cardMeta}>{[item.phone, item.email].filter(Boolean).join(' · ')}</Text>
              )}
              {item.address && <Text style={styles.cardMeta}>{item.address}</Text>}
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.expired} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>No suppliers yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first supplier</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  form: {
    padding: SPACING.xl, gap: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    color: COLORS.textPrimary, fontSize: FONT_SIZES.md, height: 50,
  },
  saveBtn: {
    backgroundColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textInverse },
  list: { padding: SPACING.xl, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: `${COLORS.accentCyan}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  cardMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: { padding: SPACING.xs },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textSecondary },
  emptySubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.sm },
});

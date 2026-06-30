import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, RADIUS, FONT_SIZES, UNITS } from '@/constants';
import { getCategories, getSuppliers, addProduct, updateProduct, getProductById } from '@/lib/db';
import { toISODateString, formatDate } from '@/lib/utils';
import { Category, Supplier, ProductInsert } from '@/types';

type Field = { label: string; key: keyof ProductInsert; placeholder: string; keyboard?: any; required?: boolean };

const TEXT_FIELDS: Field[] = [
  { label: 'Product Name *', key: 'name', placeholder: 'e.g. Amul Milk', required: true },
  { label: 'Barcode', key: 'barcode', placeholder: 'Scan or enter barcode' },
  { label: 'Batch Number', key: 'batch_number', placeholder: 'e.g. BATCH-2024-01' },
  { label: 'Location', key: 'location', placeholder: 'e.g. Shelf A, Fridge' },
  { label: 'Notes', key: 'notes', placeholder: 'Any additional notes...' },
];

export default function AddProductScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [form, setForm] = useState<Partial<ProductInsert>>({
    quantity: 1,
    unit: 'pcs',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showMfgPicker, setShowMfgPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getSuppliers()]).then(([cats, sups]) => {
      setCategories(cats);
      setSuppliers(sups);
    });

    if (isEditing) {
      getProductById(id!).then(p => {
        if (p) {
          const { id: _, category, supplier, expiry_status, days_until_expiry, ...rest } = p;
          setForm(rest);
        }
      });
    }
  }, [id]);

  function set(key: keyof ProductInsert, value: any) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = 'Product name is required';
    if (!form.expiry_date) e.expiry_date = 'Expiry date is required';
    if (!form.category_id) e.category_id = 'Please select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing) {
        await updateProduct({ id: id!, ...form } as any);
      } else {
        await addProduct(form as ProductInsert);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
        <TouchableOpacity onPress={() => router.push('/products/scan')}>
          <Ionicons name="barcode-outline" size={24} color={COLORS.accentCyan} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Text Fields */}
        {TEXT_FIELDS.map(field => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={[styles.input, errors[field.key as string] && styles.inputError]}
              placeholder={field.placeholder}
              placeholderTextColor={COLORS.textMuted}
              value={form[field.key] as string ?? ''}
              onChangeText={v => set(field.key, v)}
              keyboardType={field.keyboard}
              multiline={field.key === 'notes'}
            />
            {errors[field.key as string] && (
              <Text style={styles.errorText}>{errors[field.key as string]}</Text>
            )}
          </View>
        ))}

        {/* Quantity + Unit */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={String(form.quantity ?? 1)}
              onChangeText={v => set('quantity', parseInt(v) || 1)}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Unit</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setShowUnitPicker(true)}>
              <Text style={styles.selectorText}>{form.unit ?? 'pcs'}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category *</Text>
          {errors.category_id && <Text style={styles.errorText}>{errors.category_id}</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    form.category_id === cat.id && { backgroundColor: `${cat.color}30`, borderColor: cat.color },
                  ]}
                  onPress={() => set('category_id', cat.id)}
                >
                  <Text>{cat.icon}</Text>
                  <Text style={[styles.chipText, form.category_id === cat.id && { color: cat.color }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Expiry Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Expiry Date *</Text>
          <TouchableOpacity
            style={[styles.selector, errors.expiry_date && styles.inputError]}
            onPress={() => setShowExpiryPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
            <Text style={[styles.selectorText, !form.expiry_date && { color: COLORS.textMuted }]}>
              {form.expiry_date ? formatDate(form.expiry_date) : 'Select expiry date'}
            </Text>
          </TouchableOpacity>
          {errors.expiry_date && <Text style={styles.errorText}>{errors.expiry_date}</Text>}
        </View>

        {/* Manufacture Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Manufacture Date</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowMfgPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
            <Text style={[styles.selectorText, !form.manufacture_date && { color: COLORS.textMuted }]}>
              {form.manufacture_date ? formatDate(form.manufacture_date) : 'Select manufacture date'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Supplier */}
        {suppliers.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Supplier</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !form.supplier_id && styles.chipSelected]}
                  onPress={() => set('supplier_id', null)}
                >
                  <Text style={styles.chipText}>None</Text>
                </TouchableOpacity>
                {suppliers.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, form.supplier_id === s.id && styles.chipSelected]}
                    onPress={() => set('supplier_id', s.id)}
                  >
                    <Text style={styles.chipText}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Price */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Price (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            value={form.price ? String(form.price) : ''}
            onChangeText={v => set('price', parseFloat(v) || undefined)}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <Text style={styles.saveBtnText}>{isEditing ? 'Update Product' : 'Save Product'}</Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Date Pickers */}
      {showExpiryPicker && (
        <DateTimePicker
          value={form.expiry_date ? new Date(form.expiry_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(_, date) => {
            setShowExpiryPicker(false);
            if (date) set('expiry_date', toISODateString(date));
          }}
        />
      )}
      {showMfgPicker && (
        <DateTimePicker
          value={form.manufacture_date ? new Date(form.manufacture_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(_, date) => {
            setShowMfgPicker(false);
            if (date) set('manufacture_date', toISODateString(date));
          }}
        />
      )}

      {/* Unit Picker Modal */}
      {showUnitPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Unit</Text>
            <ScrollView>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.pickerItem, form.unit === u && styles.pickerItemActive]}
                  onPress={() => { set('unit', u); setShowUnitPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, form.unit === u && { color: COLORS.accentCyan }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.pickerClose} onPress={() => setShowUnitPicker(false)}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  scroll: { padding: SPACING.xl, paddingBottom: 100 },
  fieldGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    color: COLORS.textPrimary, fontSize: FONT_SIZES.md, minHeight: 50,
  },
  inputError: { borderColor: COLORS.expired },
  errorText: { fontSize: FONT_SIZES.xs, color: COLORS.expired, marginTop: SPACING.xs },
  row: { flexDirection: 'row', gap: SPACING.md },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50,
  },
  selectorText: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.md },
  chipRow: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  chipSelected: { backgroundColor: `${COLORS.accentCyan}20`, borderColor: COLORS.accentCyan },
  chipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  saveBtn: {
    backgroundColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textInverse },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, maxHeight: 400,
  },
  pickerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  pickerItem: {
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pickerItemActive: { backgroundColor: `${COLORS.accentCyan}10` },
  pickerItemText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  pickerClose: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md,
    height: 48, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md,
  },
  pickerCloseText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
});

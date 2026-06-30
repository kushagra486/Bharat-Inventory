import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SPACING, RADIUS, FONT_SIZES, NOTIFICATION_DAYS } from '@/constants';
import { supabase } from '@/lib/supabase';
import { getProducts } from '@/lib/db';
import { formatDate, getExpiryLabel } from '@/lib/utils';

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon, label, sublabel, value, onPress, rightElement, last
}: {
  icon: string; label: string; sublabel?: string;
  value?: string; onPress?: () => void;
  rightElement?: React.ReactNode; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={20} color={COLORS.accentCyan} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {rightElement}
      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [notifSettings, setNotifSettings] = useState<Record<number, boolean>>(
    Object.fromEntries(NOTIFICATION_DAYS.map(d => [d, true]))
  );
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadNotifSettings();
  }, []);

  async function loadNotifSettings() {
    const { data } = await supabase
      .from('notification_settings')
      .select('days_before, is_enabled')
      .eq('user_id', user?.id);

    if (data) {
      const map: Record<number, boolean> = {};
      data.forEach((s: any) => { map[s.days_before] = s.is_enabled; });
      setNotifSettings(prev => ({ ...prev, ...map }));
    }
  }

  async function toggleNotif(days: number, value: boolean) {
    setNotifSettings(prev => ({ ...prev, [days]: value }));
    await supabase.from('notification_settings').upsert({
      user_id: user?.id,
      days_before: days,
      is_enabled: value,
      channel: 'push',
    }, { onConflict: 'user_id,days_before,channel' });
  }

  async function generatePDFReport() {
    setGeneratingReport(true);
    try {
      const products = await getProducts();
      const expired = products.filter(p => p.expiry_status === 'expired');
      const soon = products.filter(p => p.expiry_status === 'soon' || p.expiry_status === 'today');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; background: #fff; color: #111; }
            h1 { color: #0099CC; font-size: 28px; margin-bottom: 4px; }
            h2 { color: #333; font-size: 18px; margin-top: 24px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
            .meta { color: #888; font-size: 12px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #f0f4ff; padding: 10px; text-align: left; font-size: 13px; }
            td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
            .expired { color: #FF3B6B; font-weight: bold; }
            .soon { color: #FFD60A; font-weight: bold; }
            .safe { color: #00CC76; font-weight: bold; }
            .stats { display: flex; gap: 16px; margin: 16px 0; }
            .stat { background: #f8f9ff; padding: 16px; border-radius: 8px; text-align: center; flex: 1; }
            .stat-val { font-size: 32px; font-weight: bold; color: #0099CC; }
            .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
          </style>
        </head>
        <body>
          <h1>⏰ Expiry Dashboard Report</h1>
          <p class="meta">Generated on ${formatDate(new Date().toISOString())} · ${user?.email}</p>

          <div class="stats">
            <div class="stat"><div class="stat-val">${products.length}</div><div class="stat-label">Total</div></div>
            <div class="stat"><div class="stat-val" style="color:#FF3B6B">${expired.length}</div><div class="stat-label">Expired</div></div>
            <div class="stat"><div class="stat-val" style="color:#FFD60A">${soon.length}</div><div class="stat-label">Soon</div></div>
            <div class="stat"><div class="stat-val" style="color:#00CC76">${products.filter(p => p.expiry_status === 'safe').length}</div><div class="stat-label">Safe</div></div>
          </div>

          ${expired.length > 0 ? `
          <h2>❌ Expired Products (${expired.length})</h2>
          <table>
            <tr><th>Name</th><th>Category</th><th>Expired On</th><th>Qty</th></tr>
            ${expired.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.category?.name ?? '-'}</td>
                <td class="expired">${formatDate(p.expiry_date)}</td>
                <td>${p.quantity} ${p.unit}</td>
              </tr>
            `).join('')}
          </table>` : ''}

          ${soon.length > 0 ? `
          <h2>⚠️ Expiring Soon (${soon.length})</h2>
          <table>
            <tr><th>Name</th><th>Category</th><th>Expiry Date</th><th>Qty</th></tr>
            ${soon.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.category?.name ?? '-'}</td>
                <td class="soon">${formatDate(p.expiry_date)}</td>
                <td>${p.quantity} ${p.unit}</td>
              </tr>
            `).join('')}
          </table>` : ''}

          <h2>📦 Full Inventory</h2>
          <table>
            <tr><th>Name</th><th>Category</th><th>Expiry</th><th>Status</th><th>Qty</th></tr>
            ${products.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.category?.name ?? '-'}</td>
                <td>${formatDate(p.expiry_date)}</td>
                <td class="${p.expiry_status}">${p.expiry_status?.toUpperCase()}</td>
                <td>${p.quantity} ${p.unit}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to generate report: ' + err.message);
    } finally {
      setGeneratingReport(false);
    }
  }

  async function exportCSV() {
    const products = await getProducts();
    const header = 'Name,Category,Barcode,Batch,Expiry Date,Status,Quantity,Unit,Location,Price\n';
    const rows = products.map(p =>
      `"${p.name}","${p.category?.name ?? ''}","${p.barcode ?? ''}","${p.batch_number ?? ''}","${p.expiry_date}","${p.expiry_status}","${p.quantity}","${p.unit}","${p.location ?? ''}","${p.price ?? ''}"`
    ).join('\n');
    const csv = header + rows;

    const { uri } = await Print.printToFileAsync({ html: `<pre>${csv}</pre>` });
    await Sharing.shareAsync(uri);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Profile */}
        <SettingsSection title="Account">
          <SettingsRow
            icon="person-circle-outline"
            label={user?.user_metadata?.full_name ?? 'My Account'}
            sublabel={user?.email}
            onPress={() => router.push('/settings/profile')}
          />
          <SettingsRow
            icon="key-outline"
            label="Change Password"
            onPress={() => router.push('/auth/forgot-password')}
            last
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          {NOTIFICATION_DAYS.map((days, i) => (
            <SettingsRow
              key={days}
              icon="notifications-outline"
              label={days === 1 ? '1 day before' : `${days} days before`}
              sublabel="Push notification"
              rightElement={
                <Switch
                  value={notifSettings[days] ?? true}
                  onValueChange={v => toggleNotif(days, v)}
                  trackColor={{ false: COLORS.bgElevated, true: `${COLORS.accentCyan}60` }}
                  thumbColor={notifSettings[days] ? COLORS.accentCyan : COLORS.textMuted}
                />
              }
              last={i === NOTIFICATION_DAYS.length - 1}
            />
          ))}
        </SettingsSection>

        {/* Reports */}
        <SettingsSection title="Reports & Export">
          <SettingsRow
            icon="document-text-outline"
            label="Generate PDF Report"
            sublabel="Full inventory with expiry status"
            rightElement={
              generatingReport ? (
                <ActivityIndicator size="small" color={COLORS.accentCyan} />
              ) : undefined
            }
            onPress={generatingReport ? undefined : generatePDFReport}
          />
          <SettingsRow
            icon="download-outline"
            label="Export to CSV"
            sublabel="Download inventory as spreadsheet"
            onPress={exportCSV}
            last
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data">
          <SettingsRow
            icon="archive-outline"
            label="Archived Products"
            onPress={() => router.push('/products/archived')}
          />
          <SettingsRow
            icon="people-outline"
            label="Suppliers"
            onPress={() => router.push('/settings/suppliers')}
            last
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsRow icon="information-circle-outline" label="Version" value="1.0.0" />
          <SettingsRow icon="code-slash-outline" label="Open Source" sublabel="MIT License · Free Forever" last />
        </SettingsSection>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.expired} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm },
  sectionCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: `${COLORS.accentCyan}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  rowSublabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  rowValue: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.xl,
    backgroundColor: `${COLORS.expired}15`, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: `${COLORS.expired}30`, height: 52,
  },
  signOutText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.expired },
});

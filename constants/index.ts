// ─── Color Palette ────────────────────────────────────────────────────────────
export const COLORS = {
  // Background layers
  bg: '#0A0E1A',
  bgCard: '#111827',
  bgElevated: '#1A2235',
  bgInput: '#0F1623',

  // Accent system
  accentCyan: '#00D4FF',
  accentGreen: '#00FF94',
  accentOrange: '#FF6B35',
  accentRed: '#FF3B6B',
  accentYellow: '#FFD60A',
  accentPurple: '#A855F7',

  // Status colors
  expired: '#FF3B6B',
  today: '#FF6B35',
  soon: '#FFD60A',
  safe: '#00FF94',

  // Text
  textPrimary: '#F0F4FF',
  textSecondary: '#8892A4',
  textMuted: '#4A5568',
  textInverse: '#0A0E1A',

  // Border
  border: '#1E2D40',
  borderLight: '#243347',

  // Gradients (start/end)
  gradientCyan: ['#00D4FF', '#0099CC'],
  gradientGreen: ['#00FF94', '#00CC76'],
  gradientRed: ['#FF3B6B', '#CC1A45'],
  gradientOrange: ['#FF6B35', '#CC4A14'],
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  mono: 'monospace',
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 42,
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ─── Default Categories ────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { name: 'Dairy', icon: '🥛', color: '#00D4FF' },
  { name: 'Grocery', icon: '🥫', color: '#00FF94' },
  { name: 'Fruits', icon: '🍎', color: '#FF6B35' },
  { name: 'Vegetables', icon: '🥦', color: '#4ADE80' },
  { name: 'Medicines', icon: '💊', color: '#A855F7' },
  { name: 'Cosmetics', icon: '🧴', color: '#F472B6' },
  { name: 'Frozen Food', icon: '🧊', color: '#38BDF8' },
  { name: 'Bakery', icon: '🍞', color: '#F59E0B' },
  { name: 'Beverages', icon: '🧃', color: '#FB923C' },
  { name: 'Electronics', icon: '📱', color: '#818CF8' },
  { name: 'Others', icon: '📦', color: '#94A3B8' },
];

// ─── Product Units ─────────────────────────────────────────────────────────────
export const UNITS = [
  'pcs', 'kg', 'g', 'mg', 'L', 'ml', 'box', 'pack',
  'bottle', 'can', 'bag', 'jar', 'tube', 'strip', 'tablet',
];

// ─── Notification Days ─────────────────────────────────────────────────────────
export const NOTIFICATION_DAYS = [1, 3, 7, 15, 30];

// ─── Expiry Thresholds (days) ──────────────────────────────────────────────────
export const EXPIRY_THRESHOLDS = {
  soon: 7,    // within 7 days = "expiring soon"
  today: 0,   // 0 days = "expires today"
};

// ─── Chart Colors ─────────────────────────────────────────────────────────────
export const CHART_COLORS = [
  '#00D4FF', '#00FF94', '#A855F7', '#FF6B35',
  '#FFD60A', '#F472B6', '#38BDF8', '#4ADE80',
];

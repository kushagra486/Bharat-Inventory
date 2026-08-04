import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.accentCyan} />
    </View>
  );
}

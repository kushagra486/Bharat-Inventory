import { LayoutDashboard, Package, BarChart3, Calendar } from 'lucide-react';
import { Page } from '../App';
import { C } from '../lib/tokens';

const tabs = [
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { id: 'products', label: 'Products', Icon: Package },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
] as const;

export default function BottomNav({ current, nav }: { current: Page; nav: (p: Page) => void }) {
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, height:'72px',
      background: C.bgCard, borderTop:`1px solid ${C.border}`,
      display:'flex', alignItems:'stretch',
      paddingBottom:'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {tabs.map(({ id, label, Icon }) => {
        const active = current === id;
        return (
          <button key={id} onClick={() => nav(id as Page)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:'4px', background:'none', border:'none',
            color: active ? C.cyan : C.textMuted, cursor:'pointer',
            transition:'color 200ms', minHeight:'44px',
          }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize:'11px', fontWeight: active ? 700 : 400 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

import { C } from '../lib/tokens';
export default function StatCard({ label, value, color, onClick }: { label: string; value: number; color: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: C.bgCard, borderRadius:'12px', border:`1px solid ${C.border}`,
      borderLeft:`3px solid ${color}`, padding:'16px 12px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
      cursor: onClick ? 'pointer' : 'default', minHeight:'44px', flex:1,
      transition:'background 150ms',
    }}
    onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.background = C.bgElevated)}
    onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.background = C.bgCard)}>
      <span style={{ fontSize:'24px', fontWeight:800, color }}>{value}</span>
      <span style={{ fontSize:'11px', color: C.textMuted, textAlign:'center' }}>{label}</span>
    </button>
  );
}

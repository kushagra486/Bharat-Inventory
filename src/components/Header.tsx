import { ArrowLeft } from 'lucide-react';
import { C } from '../lib/tokens';
export default function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'16px 20px', paddingTop:'calc(16px + env(safe-area-inset-top))',
      background: C.bgCard, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:10,
    }}>
      <div style={{ width:40 }}>
        {onBack && (
          <button onClick={onBack} style={{ background:'none', border:'none', color:C.text, cursor:'pointer', display:'flex', padding:'8px' }}>
            <ArrowLeft size={22} />
          </button>
        )}
      </div>
      <h1 style={{ fontSize:'17px', fontWeight:700, color:C.text, flex:1, textAlign:'center' }}>{title}</h1>
      <div style={{ width:40, display:'flex', justifyContent:'flex-end' }}>{right}</div>
    </div>
  );
}

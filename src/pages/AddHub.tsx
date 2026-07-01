import { ScanBarcode, Camera, FileSpreadsheet, PenLine } from 'lucide-react';
import Header from '../components/Header';
import { C } from '../lib/tokens';
import { Page } from '../App';

const METHODS = [
  { page:'add-manual' as Page, Icon: PenLine, color: C.cyan, title:'Manual Entry', desc:'Type in all product details yourself', time:'~1 min' },
  { page:'scan' as Page, Icon: ScanBarcode, color: C.green, title:'Barcode Scan', desc:'Scan barcode — auto-fills name, brand & category from Open Food Facts', time:'~10 sec' },
  { page:'ocr' as Page, Icon: Camera, color: C.purple, title:'Label Scanner (OCR)', desc:'Photo the label — reads expiry, batch & name on-device, offline', time:'~20 sec' },
  { page:'import' as Page, Icon: FileSpreadsheet, color: C.orange, title:'CSV / Excel Import', desc:'Bulk-add many products at once from a spreadsheet — no row limit', time:'~2 min' },
];

export default function AddHub({ nav }: { nav: (p: Page) => void }) {
  return (
    <div>
      <Header title="Add Products" onBack={() => nav('dashboard')} />
      <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'12px' }}>
        <p style={{ color: C.textSec, fontSize:'14px', lineHeight:1.6, marginBottom:'8px' }}>
          All methods are always available — nothing locked, nothing gated. Only one method runs at a time.
        </p>
        {METHODS.map(({ page, Icon, color, title, desc, time }) => (
          <button key={page} onClick={() => nav(page)} style={{
            display:'flex', alignItems:'center', gap:'16px',
            background: C.bgCard, border:`1px solid ${color}30`, borderRadius:'14px',
            padding:'18px 16px', cursor:'pointer', textAlign:'left',
            transition:'background 150ms, border-color 150ms', width:'100%',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bgElevated}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.bgCard}>
            <div style={{ width:'52px', height:'52px', borderRadius:'12px', background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={24} color={color} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:'15px', fontWeight:700, color: C.text }}>{title}</p>
              <p style={{ fontSize:'12px', color: C.textSec, marginTop:'3px', lineHeight:1.5 }}>{desc}</p>
            </div>
            <div style={{ flexShrink:0 }}>
              <span style={{ fontSize:'11px', fontWeight:600, color }}>{time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

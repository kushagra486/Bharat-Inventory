import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import Header from '../components/Header';
import { C } from '../lib/tokens';
import { addProduct, getProducts, getCategories, getSuppliers } from '../lib/db';
import { Page } from '../App';
import Papa from 'papaparse';

interface Row { name: string; expiry_date: string; category_name?: string; supplier_name?: string; barcode?: string; batch_number?: string; manufacture_date?: string; quantity?: number; unit?: string; price?: number; location?: string; notes?: string; errors: string[]; isDup?: boolean; }

const ALIASES: Record<string,string> = {
  name:'name','product name':'name','product':'name',
  category:'category_name','category name':'category_name',
  barcode:'barcode',upc:'barcode',ean:'barcode',
  batch:'batch_number','batch number':'batch_number','batch no':'batch_number',
  mfg:'manufacture_date','mfg date':'manufacture_date',
  expiry:'expiry_date','expiry date':'expiry_date','exp date':'expiry_date',exp:'expiry_date',
  qty:'quantity',quantity:'quantity',unit:'unit',
  supplier:'supplier_name','supplier name':'supplier_name',
  price:'price',location:'location',notes:'notes',
};

function toISO(raw: string): string | undefined {
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split(/[\/\-.]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return undefined;
  let [a,b,c] = parts;
  let y: number, mo: number, d: number;
  if (a > 31) { y=a; mo=b; d=c; } else if (c < 100) { y=2000+c; mo=b; d=a; } else { y=c; mo=b; d=a; }
  if (mo<1||mo>12||d<1||d>31) return undefined;
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function parseRows(raw: Record<string,string>[], dupBarcodes: Set<string>): Row[] {
  return raw.map(rawRow => {
    const mapped: any = {};
    for (const [h, v] of Object.entries(rawRow)) {
      const field = ALIASES[h.trim().toLowerCase().replace(/\s+/g,' ')];
      if (field) mapped[field] = v;
    }
    const errors: string[] = [];
    if (!mapped.name?.trim()) errors.push('Missing name');
    const expiry_date = toISO(mapped.expiry_date || '');
    if (!expiry_date) errors.push('Invalid expiry date');
    return {
      name: mapped.name?.trim() || '',
      expiry_date: expiry_date || '',
      category_name: mapped.category_name?.trim(),
      supplier_name: mapped.supplier_name?.trim(),
      barcode: mapped.barcode?.trim() || undefined,
      batch_number: mapped.batch_number?.trim() || undefined,
      manufacture_date: toISO(mapped.manufacture_date || ''),
      quantity: parseInt(mapped.quantity) || 1,
      unit: mapped.unit?.trim() || 'pcs',
      price: parseFloat(mapped.price) || undefined,
      location: mapped.location?.trim() || undefined,
      notes: mapped.notes?.trim() || undefined,
      errors,
      isDup: mapped.barcode ? dupBarcodes.has(mapped.barcode.trim()) : false,
    };
  });
}

export default function ImportPage({ nav }: { nav: (p: Page) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [stage, setStage] = useState<'pick'|'preview'|'importing'|'done'>('pick');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ success:0, failed:0 });
  const [fileName, setFileName] = useState('');

  async function handleFile(file: File) {
    setFileName(file.name);
    let rawRows: Record<string,string>[];
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const { read, utils } = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = read(buf, { type:'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rawRows = (utils.sheet_to_json(ws, { defval:'', raw:false }) as any[]).map(r => {
        const out: Record<string,string> = {};
        for (const [k,v] of Object.entries(r)) out[k.trim().toLowerCase()] = String(v ?? '');
        return out;
      });
    } else {
      const text = await file.text();
      const res = Papa.parse<Record<string,string>>(text, { header:true, skipEmptyLines:true, transformHeader: h => h.trim().toLowerCase() });
      rawRows = res.data;
    }
    if (!rawRows.length) { alert('No rows found'); return; }
    const existing = await getProducts();
    const dups = new Set(existing.map(p => p.barcode).filter(Boolean) as string[]);
    setRows(parseRows(rawRows, dups));
    setStage('preview');
  }

  async function doImport() {
    const valid = (rows ?? []).filter(r => r.errors.length === 0);
    if (!valid.length) { alert('No valid rows to import'); return; }
    setStage('importing');
    const [cats, sups] = await Promise.all([getCategories(), getSuppliers()]);
    const catMap = new Map(cats.map((c: any) => [c.name.toLowerCase(), c.id]));
    const supMap = new Map(sups.map((s: any) => [s.name.toLowerCase(), s.id]));
    const othersId = catMap.get('others') ?? cats[0]?.id;
    let success = 0, failed = 0;
    for (let i = 0; i < valid.length; i++) {
      const r = valid[i];
      try {
        await addProduct({
          name: r.name, expiry_date: r.expiry_date,
          category_id: (r.category_name && catMap.get(r.category_name.toLowerCase())) || othersId,
          supplier_id: r.supplier_name ? supMap.get(r.supplier_name.toLowerCase()) : undefined,
          barcode: r.barcode, batch_number: r.batch_number, manufacture_date: r.manufacture_date,
          quantity: r.quantity ?? 1, unit: r.unit ?? 'pcs',
          price: r.price, location: r.location, notes: r.notes,
        });
        success++;
      } catch { failed++; }
      setProgress((i+1)/valid.length);
    }
    setResult({ success, failed }); setStage('done');
  }

  function dlTemplate() {
    const csv = Papa.unparse([
      ['name','category','barcode','batch_number','manufacture_date','expiry_date','quantity','unit','supplier','price','location','notes'],
      ['Amul Milk 1L','Dairy','8901234567890','BATCH-001','2026-06-01','2026-07-15','10','pcs','Local Dairy','60','Fridge A','Sample — delete me'],
    ]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = 'bharat-inventory-template.csv'; a.click();
  }

  const validCount = (rows ?? []).filter(r => r.errors.length === 0).length;
  const errCount = (rows ?? []).length - validCount;

  if (stage === 'done') return (
    <div>
      <Header title="Import Complete" onBack={() => nav('products')} />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', gap:'16px', textAlign:'center' }}>
        <div style={{ fontSize:'64px' }}>✅</div>
        <h2 style={{ fontSize:'22px', fontWeight:800, color: C.text }}>{result.success} product{result.success !== 1 ? 's' : ''} imported</h2>
        {result.failed > 0 && <p style={{ color: C.red }}>{result.failed} failed</p>}
        <button onClick={() => nav('dashboard')} style={{ padding:'14px 32px', background: C.cyan, color: C.textInv, border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:700, cursor:'pointer', marginTop:'16px' }}>Back to Dashboard</button>
      </div>
    </div>
  );

  if (stage === 'importing') return (
    <div>
      <Header title="Importing…" />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', gap:'20px' }}>
        <div style={{ width:'100%', maxWidth:'320px', height:'8px', background: C.bgCard, borderRadius:'4px', overflow:'hidden' }}>
          <div style={{ height:'100%', background: C.orange, borderRadius:'4px', width:`${progress*100}%`, transition:'width 200ms' }} />
        </div>
        <p style={{ color: C.textSec }}>{Math.round(progress*100)}% complete</p>
      </div>
    </div>
  );

  if (stage === 'preview' && rows) return (
    <div>
      <Header title={`Preview — ${fileName}`} onBack={() => setStage('pick')} />
      <div style={{ padding:'16px 20px', display:'flex', gap:'10px' }}>
        {[['Valid', validCount, C.green], ['Errors', errCount, C.red], ['Dups', rows.filter(r=>r.isDup).length, C.yellow]].map(([l,v,c]) => (
          <div key={String(l)} style={{ flex:1, background: C.bgCard, border:`1px solid ${String(c)}30`, borderRadius:'10px', padding:'12px', textAlign:'center' }}>
            <p style={{ fontSize:'22px', fontWeight:800, color:String(c) }}>{String(v)}</p>
            <p style={{ fontSize:'11px', color: C.textMuted }}>{String(l)}</p>
          </div>
        ))}
      </div>
      <div style={{ padding:'0 20px', maxHeight:'calc(100dvh - 280px)', overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ background: C.bgCard, borderRadius:'10px', border:`1px solid ${r.errors.length ? C.red+'60' : C.border}`, padding:'12px 14px' }}>
            <p style={{ fontWeight:600, color: C.text, fontSize:'14px' }}>{r.name || '(no name)'}</p>
            <p style={{ fontSize:'12px', color: C.textMuted, marginTop:'2px' }}>{r.expiry_date || 'no expiry'} · Qty {r.quantity}</p>
            {r.errors.map(e => <p key={e} style={{ color: C.red, fontSize:'12px', marginTop:'4px' }}>{e}</p>)}
            {r.isDup && <p style={{ color: C.yellow, fontSize:'12px', marginTop:'4px' }}>⚠️ Barcode already in inventory</p>}
          </div>
        ))}
      </div>
      <div style={{ padding:'16px 20px', borderTop:`1px solid ${C.border}`, background: C.bg }}>
        <button onClick={doImport} disabled={validCount === 0} style={{ width:'100%', padding:'16px', background: validCount ? C.orange : C.bgElevated, color: validCount ? C.textInv : C.textMuted, border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:700, cursor: validCount ? 'pointer' : 'not-allowed' }}>
          Import {validCount} Product{validCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <Header title="CSV / Excel Import" onBack={() => nav('add-hub')} />
      <div style={{ padding:'32px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px', textAlign:'center' }}>
        <div style={{ width:'72px', height:'72px', borderRadius:'16px', background:`${C.orange}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Upload size={32} color={C.orange} />
        </div>
        <div>
          <h2 style={{ fontSize:'20px', fontWeight:800, color: C.text }}>Bulk Import Products</h2>
          <p style={{ color: C.textSec, fontSize:'14px', marginTop:'8px', lineHeight:1.6 }}>Upload a .csv, .xlsx or .xls file. Preview and validate before anything saves. No row limit.</p>
        </div>
        <button onClick={() => fileRef.current?.click()} style={{ width:'100%', maxWidth:'320px', padding:'16px', background: C.orange, color: C.textInv, border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
          <Upload size={18} /> Choose File
        </button>
        <button onClick={dlTemplate} style={{ display:'flex', alignItems:'center', gap:'8px', background:'none', border:'none', color: C.orange, fontSize:'14px', cursor:'pointer', fontWeight:600 }}>
          <Download size={16} /> Download CSV Template
        </button>
        <p style={{ color: C.textMuted, fontSize:'12px' }}>Supports .csv · .xlsx · .xls · No server · Fully offline</p>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}

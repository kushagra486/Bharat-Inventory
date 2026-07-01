import { useEffect, useState } from 'react';
import { Search, Plus, Archive, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { C } from '../lib/tokens';
import { getProducts, deleteProduct, archiveProduct } from '../lib/db';
import { expiryLabel, statusColor, fmtDate } from '../lib/utils';
import { Product } from '../types';
import { Page } from '../App';

export default function ProductsPage({ nav }: { nav: (p: Page, opts?: any) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'expired'|'today'|'soon'|'safe'>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const p = await getProducts({ search: search || undefined, status: filter === 'all' ? undefined : filter });
    setProducts(p); setLoading(false);
  }
  useEffect(() => { load(); }, [search, filter]);

  const filtered = products;
  const inp: React.CSSProperties = { width:'100%', padding:'12px 14px 12px 40px', background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'10px', color: C.text, fontSize:'15px', outline:'none' };

  return (
    <div>
      <Header title="Products" right={
        <button onClick={() => nav('add-hub')} style={{ background:'none', border:'none', color: C.cyan, cursor:'pointer', display:'flex', padding:'8px' }}>
          <Plus size={22} />
        </button>
      } />

      <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:'12px', position:'sticky', top:'57px', background: C.bg, zIndex:5 }}>
        {/* Search */}
        <div style={{ position:'relative' }}>
          <Search size={16} color={C.textMuted} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }} />
          <input style={inp} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Filter chips */}
        <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'2px' }}>
          {([['all','All',C.cyan],['expired','Expired',C.red],['today','Today',C.orange],['soon','Soon',C.yellow],['safe','Safe',C.green]] as const).map(([id,label,col]) => (
            <button key={id} onClick={() => setFilter(id as any)} style={{
              padding:'6px 14px', borderRadius:'20px', border:`1px solid ${filter===id ? col : C.border}`,
              background: filter===id ? `${col}20` : C.bgCard, color: filter===id ? col : C.textSec,
              cursor:'pointer', fontSize:'13px', fontWeight:600, whiteSpace:'nowrap', flexShrink:0,
              transition:'all 150ms',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:'8px' }}>
        {loading && <p style={{ textAlign:'center', color: C.textMuted, padding:'40px' }}>Loading…</p>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <p style={{ fontSize:'48px' }}>📭</p>
            <p style={{ color: C.textSec, marginTop:'12px' }}>No products found</p>
            <button onClick={() => nav('add-hub')} style={{ marginTop:'16px', padding:'12px 24px', background: C.cyan, color: C.textInv, border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>Add First Product</button>
          </div>
        )}
        {filtered.map(p => {
          const col = statusColor(p.expiry_status!);
          return (
            <div key={p.id} style={{ background: C.bgCard, border:`1px solid ${C.border}`, borderLeft:`3px solid ${col}`, borderRadius:'12px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'10px', background: C.bgElevated, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                {p.category?.icon ?? '📦'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:600, color: C.text, fontSize:'15px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</p>
                <p style={{ fontSize:'12px', color: C.textMuted, marginTop:'2px' }}>{p.quantity} {p.unit} · {p.category?.name}</p>
                <p style={{ fontSize:'12px', color: col, marginTop:'2px', fontWeight:600 }}>{expiryLabel(p.expiry_date)}</p>
              </div>
              <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                <button onClick={() => nav('add-manual', { editId: p.id })} style={{ background: C.bgElevated, border:'none', borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: C.textSec }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={async () => { if (confirm(`Archive "${p.name}"?`)) { await archiveProduct(p.id); load(); }}} style={{ background: C.bgElevated, border:'none', borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: C.textMuted }}>
                  <Archive size={15} />
                </button>
                <button onClick={async () => { if (confirm(`Delete "${p.name}"? This cannot be undone.`)) { await deleteProduct(p.id); load(); }}} style={{ background:`${C.red}15`, border:'none', borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: C.red }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Header from '../components/Header';
import { C, UNITS } from '../lib/tokens';
import { addProduct, updateProduct, getProductById, getCategories, getSuppliers } from '../lib/db';
import { Category, Supplier, ProductInsert } from '../types';
import { Page } from '../App';

export default function AddManual({ nav, editId, prefill }: { nav: (p: Page) => void; editId?: string; prefill?: Record<string, string> }) {
  const isEdit = !!editId;
  const [form, setForm] = useState<Partial<ProductInsert>>({ quantity:1, unit:'pcs', ...Object.fromEntries(Object.entries(prefill ?? {}).filter(([,v]) => v)) });
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [prefillBanner, setPrefillBanner] = useState(Object.keys(prefill ?? {}).length > 0);

  useEffect(() => {
    Promise.all([getCategories(), getSuppliers()]).then(([cats, sups]) => {
      setCategories(cats); setSuppliers(sups);
      if (prefill?.prefillCategory && !isEdit) {
        const m = cats.find((c: Category) => c.name.toLowerCase() === prefill.prefillCategory?.toLowerCase());
        if (m) setForm(f => ({ ...f, category_id: m.id }));
      }
    });
    if (isEdit) getProductById(editId!).then(p => {
      if (p) { const { id:_, category, supplier, expiry_status, days_until_expiry, ...rest } = p; setForm(rest); }
    });
  }, []);

  const set = (k: keyof ProductInsert, v: any) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string,string> = {};
    if (!form.name?.trim()) errs.name = 'Required';
    if (!form.expiry_date) errs.expiry_date = 'Required';
    if (!form.category_id) errs.category_id = 'Select a category';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (isEdit) await updateProduct({ id: editId!, ...form } as any);
      else await addProduct(form as ProductInsert);
      nav('products');
    } catch (err: any) { alert(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'13px 14px', background: C.bgElevated, border:`1px solid ${C.border}`, borderRadius:'10px', color: C.text, fontSize:'15px', outline:'none' };
  const errInp: React.CSSProperties = { ...inp, borderColor: C.red };
  const lbl: React.CSSProperties = { display:'block', fontSize:'13px', color: C.textSec, marginBottom:'6px', fontWeight:600 };

  return (
    <div>
      <Header title={isEdit ? 'Edit Product' : 'Add Product'} onBack={() => nav('add-hub')} />
      <form onSubmit={save} style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'16px', paddingBottom:'100px' }}>
        {prefillBanner && (
          <div style={{ display:'flex', gap:'10px', alignItems:'center', background:`${C.cyan}15`, border:`1px solid ${C.cyan}30`, borderRadius:'10px', padding:'12px 14px' }}>
            <Sparkles size={16} color={C.cyan} />
            <p style={{ flex:1, fontSize:'12px', color: C.textSec }}>Some fields were auto-filled — please verify before saving.</p>
            <button type="button" onClick={() => setPrefillBanner(false)} style={{ background:'none', border:'none', color: C.textMuted, cursor:'pointer', fontSize:'18px', lineHeight:1 }}>×</button>
          </div>
        )}

        {/* Name */}
        <div>
          <label style={lbl}>Product Name *</label>
          <input style={errors.name ? errInp : inp} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Amul Milk" />
          {errors.name && <p style={{ color: C.red, fontSize:'12px', marginTop:'4px' }}>{errors.name}</p>}
        </div>

        {/* Barcode + Batch */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={lbl}>Barcode</label>
            <input style={inp} value={form.barcode ?? ''} onChange={e => set('barcode', e.target.value)} placeholder="Scan or enter" />
          </div>
          <div>
            <label style={lbl}>Batch No.</label>
            <input style={inp} value={form.batch_number ?? ''} onChange={e => set('batch_number', e.target.value)} placeholder="BATCH-001" />
          </div>
        </div>

        {/* Category */}
        <div>
          <label style={lbl}>Category *</label>
          {errors.category_id && <p style={{ color: C.red, fontSize:'12px', marginBottom:'6px' }}>{errors.category_id}</p>}
          <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'4px' }}>
            {categories.map(cat => (
              <button type="button" key={cat.id} onClick={() => set('category_id', cat.id)} style={{
                display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px',
                borderRadius:'20px', border:`1px solid ${form.category_id === cat.id ? cat.color : C.border}`,
                background: form.category_id === cat.id ? `${cat.color}25` : C.bgCard,
                color: form.category_id === cat.id ? cat.color : C.textSec,
                cursor:'pointer', whiteSpace:'nowrap', fontSize:'13px', fontWeight:600,
                transition:'all 150ms', flexShrink:0,
              }}>
                <span>{cat.icon}</span><span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={lbl}>Expiry Date *</label>
            <input type="date" style={errors.expiry_date ? errInp : inp} value={form.expiry_date ?? ''} onChange={e => set('expiry_date', e.target.value)} />
            {errors.expiry_date && <p style={{ color: C.red, fontSize:'12px', marginTop:'4px' }}>{errors.expiry_date}</p>}
          </div>
          <div>
            <label style={lbl}>Mfg. Date</label>
            <input type="date" style={inp} value={form.manufacture_date ?? ''} onChange={e => set('manufacture_date', e.target.value)} />
          </div>
        </div>

        {/* Qty + Unit */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={lbl}>Quantity</label>
            <input type="number" min="1" style={inp} value={form.quantity ?? 1} onChange={e => set('quantity', parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <label style={lbl}>Unit</label>
            <select style={inp} value={form.unit ?? 'pcs'} onChange={e => set('unit', e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Price + Location */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={lbl}>Price (₹)</label>
            <input type="number" step="0.01" style={inp} value={form.price ?? ''} onChange={e => set('price', parseFloat(e.target.value) || undefined)} placeholder="0.00" />
          </div>
          <div>
            <label style={lbl}>Location</label>
            <input style={inp} value={form.location ?? ''} onChange={e => set('location', e.target.value)} placeholder="Shelf A" />
          </div>
        </div>

        {/* Supplier */}
        {suppliers.length > 0 && (
          <div>
            <label style={lbl}>Supplier</label>
            <select style={inp} value={form.supplier_id ?? ''} onChange={e => set('supplier_id', e.target.value || undefined)}>
              <option value="">None</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label style={lbl}>Notes</label>
          <textarea style={{ ...inp, minHeight:'80px', resize:'vertical' }} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" />
        </div>

        {/* Save */}
        <button type="submit" disabled={saving} style={{
          width:'100%', padding:'16px', background: saving ? C.bgElevated : C.cyan,
          color: saving ? C.textMuted : C.textInv, border:'none', borderRadius:'12px',
          fontSize:'16px', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
          transition:'background 150ms', marginTop:'8px',
        }}>
          {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}

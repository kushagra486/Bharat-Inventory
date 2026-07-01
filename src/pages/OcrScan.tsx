import { useRef, useState } from 'react';
import { PenLine } from 'lucide-react';
import Header from '../components/Header';
import { C } from '../lib/tokens';
import { Page } from '../App';

interface OcrFields { name?: string; expiry?: string; mfg?: string; batch?: string; }

function findDate(text: string, patterns: RegExp[]): string | undefined {
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return normalizeDate(m[2] || m[1]);
  }
}
function normalizeDate(raw: string): string | undefined {
  const parts = raw.split(/[\/\-.]/).map(p => p.trim());
  if (parts.length < 2) return undefined;
  try {
    if (parts.length === 3) {
      let [a,b,c] = parts.map(Number);
      let y: number, mo: number, d: number;
      if (a > 31) { y=a; mo=b; d=c; }
      else if (c < 100) { y=2000+c; mo=b; d=a; }
      else { y=c; mo=b; d=a; }
      if (mo<1||mo>12||d<1||d>31) return undefined;
      return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
    if (parts.length === 2) {
      let [m,y] = parts.map(Number);
      if (y < 100) y += 2000;
      const last = new Date(y,m,0).getDate();
      return `${y}-${String(m).padStart(2,'0')}-${String(last).padStart(2,'0')}`;
    }
  } catch {}
}
function extractFields(text: string): OcrFields {
  const EXP = /(exp(?:iry)?|use by|best before|bb)[:\s.]*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[0-9]{1,2}[\/\-.][0-9]{4})/i;
  const MFG = /(mfg|mfd|manufactured?|packed on)[:\s.]*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i;
  const BATCH = /(batch|lot)[:\s:#]*([A-Z0-9\-]{3,15})/i;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name: string | undefined;
  for (const line of lines) {
    if (line.length < 3 || /^[\d\s\/\-.:]+$/.test(line) || /^(exp|mfg|batch|lot|use by|best before)/i.test(line)) continue;
    name = line.slice(0, 60); break;
  }
  return { name, expiry: findDate(text, [EXP]), mfg: findDate(text, [MFG]), batch: text.match(BATCH)?.[2] };
}

export default function OcrScanPage({ nav }: { nav: (p: Page, opts?: any) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fields, setFields] = useState<OcrFields | null>(null);
  const [rawText, setRawText] = useState('');

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url); setProcessing(true); setFields(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(url);
      await worker.terminate();
      const extracted = extractFields(data.text);
      setFields(extracted); setRawText(data.text);
    } catch (e) {
      alert('OCR failed. Please try again or enter manually.');
    } finally { setProcessing(false); }
  }

  function usePrefill() {
    nav('add-manual', { prefill: {
      prefillName: fields?.name ?? '',
      prefillExpiry: fields?.expiry ?? '',
      prefillMfg: fields?.mfg ?? '',
      prefillBatch: fields?.batch ?? '',
    }});
  }

  return (
    <div>
      <Header title="Label Scanner (OCR)" onBack={() => nav('add-hub')} />
      <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'20px' }}>
        <div style={{ background: C.bgCard, border:`2px dashed ${C.purple}40`, borderRadius:'14px', padding:'32px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', cursor:'pointer' }}
          onClick={() => fileRef.current?.click()}>
          <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:`${C.purple}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontWeight:700, color: C.text, fontSize:'16px' }}>Take or Upload Photo</p>
            <p style={{ color: C.textSec, fontSize:'13px', marginTop:'4px' }}>Photo the product label — OCR reads expiry, batch & name</p>
            <p style={{ color: C.textMuted, fontSize:'12px', marginTop:'4px' }}>Runs fully on-device · No network · No limit</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {processing && (
          <div style={{ textAlign:'center', padding:'24px', color: C.purple }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>🔍</div>
            <p style={{ fontWeight:600 }}>Reading label…</p>
            <p style={{ color: C.textSec, fontSize:'13px', marginTop:'4px' }}>On-device OCR, no internet needed</p>
          </div>
        )}

        {preview && !processing && (
          <img src={preview} style={{ width:'100%', borderRadius:'12px', border:`1px solid ${C.border}`, maxHeight:'200px', objectFit:'cover' }} alt="Captured label" />
        )}

        {fields && !processing && (
          <div style={{ background: C.bgCard, borderRadius:'12px', border:`1px solid ${C.border}`, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontWeight:700, color: C.text, fontSize:'15px' }}>Extracted Fields</p>
              <span style={{ fontSize:'12px', color: C.green }}>✓ Verify before saving</span>
            </div>
            {[
              { label:'Product Name', value: fields.name },
              { label:'Expiry Date', value: fields.expiry },
              { label:'Manufacture Date', value: fields.mfg },
              { label:'Batch Number', value: fields.batch },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:'12px' }}>
                <span style={{ fontSize:'13px', color: C.textSec, width:'130px', flexShrink:0 }}>{label}</span>
                <span style={{ fontSize:'13px', color: value ? C.text : C.textMuted }}>{value || '—'}</span>
              </div>
            ))}
            <div style={{ padding:'16px' }}>
              <button onClick={usePrefill} style={{ width:'100%', padding:'14px', background: C.purple, color:'#fff', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:700, cursor:'pointer' }}>
                Use These Fields →
              </button>
            </div>
          </div>
        )}

        <button onClick={() => nav('add-manual', {})} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'none', border:`1px solid ${C.border}`, borderRadius:'12px', padding:'14px', cursor:'pointer', color: C.textSec, fontSize:'14px' }}>
          <PenLine size={16} /> Enter Manually Instead
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Zap, ZapOff, PenLine } from 'lucide-react';
import Header from '../components/Header';
import { C } from '../lib/tokens';
import { getProducts } from '../lib/db';
import { lookupBarcode, guessCategory } from '../lib/barcodeLookup';
import { Page } from '../App';

export default function ScanPage({ nav }: { nav: (p: Page, opts?: any) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [torch, setTorch] = useState(false);
  const [status, setStatus] = useState('Initializing camera…');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); cancelAnimationFrame(rafRef.current); };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment', width:{ ideal:1280 }, height:{ ideal:720 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      // BarcodeDetector API (Chrome Android / Edge) — no library needed
      if ('BarcodeDetector' in window) {
        detectorRef.current = new (window as any).BarcodeDetector({ formats:['ean_13','ean_8','code_128','code_39','upc_a','upc_e','qr_code'] });
        setStatus('Point camera at a barcode');
        scanLoop();
      } else {
        setError('Barcode detection not supported in this browser. Try Chrome on Android.');
        setStatus('');
      }
    } catch { setError('Camera access denied. Please allow camera and reload.'); setStatus(''); }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  async function scanLoop() {
    if (!videoRef.current || !detectorRef.current || processing) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) { await handleDetected(barcodes[0].rawValue); return; }
    } catch {}
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  async function handleDetected(barcode: string) {
    cancelAnimationFrame(rafRef.current);
    setProcessing(true);
    setStatus('Looking up product…');

    const existing = await getProducts({ barcode });
    if (existing.length > 0) {
      if (confirm(`✅ Already in your inventory: "${existing[0].name}"\nView this product?`)) {
        stopCamera(); nav('products');
      } else { setProcessing(false); setStatus('Point camera at a barcode'); scanLoop(); }
      return;
    }

    const info = await lookupBarcode(barcode);
    stopCamera();
    if (info.found) {
      nav('add-manual', { prefill: {
        barcode, prefillName: info.name ?? '', prefillBrand: info.brand ?? '',
        prefillCategory: guessCategory(info.categoryGuess), prefillImage: info.imageUrl ?? '',
      }});
    } else {
      nav('add-manual', { prefill: { barcode } });
    }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try { await track.applyConstraints({ advanced:[{ torch: !torch } as any] }); setTorch(t => !t); } catch {}
  }

  return (
    <div style={{ height:'100dvh', background:'#000', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      <video ref={videoRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} playsInline muted />

      {/* Dark overlay */}
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />

      {/* Top bar */}
      <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', paddingTop:'calc(16px + env(safe-area-inset-top))', background:'rgba(0,0,0,0.5)' }}>
        <button onClick={() => { stopCamera(); nav('add-hub'); }} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:'44px', height:'44px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:'20px' }}>×</button>
        <span style={{ color:'#fff', fontWeight:700, fontSize:'17px' }}>Scan Barcode</span>
        <button onClick={toggleTorch} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:'44px', height:'44px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: torch ? C.cyan : '#fff' }}>
          {torch ? <Zap size={20} /> : <ZapOff size={20} />}
        </button>
      </div>

      {/* Viewfinder */}
      <div style={{ position:'relative', zIndex:10, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px' }}>
        <div style={{ width:'260px', height:'180px', position:'relative' }}>
          {['TL','TR','BL','BR'].map(pos => (
            <div key={pos} style={{
              position:'absolute', width:'28px', height:'28px',
              borderColor: C.cyan, borderStyle:'solid', borderWidth:0,
              ...(pos === 'TL' ? { top:0, left:0, borderTopWidth:3, borderLeftWidth:3, borderTopLeftRadius:4 } :
                  pos === 'TR' ? { top:0, right:0, borderTopWidth:3, borderRightWidth:3, borderTopRightRadius:4 } :
                  pos === 'BL' ? { bottom:0, left:0, borderBottomWidth:3, borderLeftWidth:3, borderBottomLeftRadius:4 } :
                               { bottom:0, right:0, borderBottomWidth:3, borderRightWidth:3, borderBottomRightRadius:4 }),
            }} />
          ))}
        </div>
        {(status || error) && (
          <div style={{ background:'rgba(0,0,0,0.6)', borderRadius:'20px', padding:'8px 18px', color: error ? C.red : 'rgba(255,255,255,0.9)', fontSize:'13px' }}>
            {error || status}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ position:'relative', zIndex:10, padding:'24px 20px', paddingBottom:'calc(24px + env(safe-area-inset-bottom))', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center' }}>
        <button onClick={() => { stopCamera(); nav('add-manual', {}); }} style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.1)', border:`1px solid ${C.cyan}60`, borderRadius:'24px', padding:'12px 24px', cursor:'pointer', color: C.cyan, fontSize:'14px', fontWeight:600 }}>
          <PenLine size={16} /> Enter Manually
        </button>
      </div>
    </div>
  );
}

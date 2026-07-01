import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { C } from '../lib/tokens';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
        setSuccess('Check your email to confirm your account.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'14px 16px', background: C.bgElevated,
    border:`1px solid ${C.border}`, borderRadius:'10px', color: C.text,
    fontSize:'15px', outline:'none', transition:'border-color 150ms',
  };

  return (
    <div style={{ minHeight:'100dvh', background: C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>📦</div>
          <h1 style={{ fontSize:'28px', fontWeight:800, color: C.text }}>Bharat Inventory</h1>
          <p style={{ color: C.textSec, marginTop:'8px', fontSize:'14px' }}>Product expiry tracker</p>
        </div>

        <div style={{ background: C.bgCard, borderRadius:'16px', border:`1px solid ${C.border}`, padding:'28px' }}>
          <div style={{ display:'flex', marginBottom:'24px', background: C.bgElevated, borderRadius:'10px', padding:'4px' }}>
            {(['login','signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, padding:'10px', borderRadius:'8px', border:'none', cursor:'pointer',
                background: mode === m ? C.cyan : 'transparent',
                color: mode === m ? C.textInv : C.textSec,
                fontWeight: mode === m ? 700 : 400, fontSize:'14px',
                transition:'all 150ms',
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display:'block', fontSize:'13px', color: C.textSec, marginBottom:'6px', fontWeight:600 }}>Full Name</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.cyan}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
              </div>
            )}
            <div>
              <label style={{ display:'block', fontSize:'13px', color: C.textSec, marginBottom:'6px', fontWeight:600 }}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.cyan}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'13px', color: C.textSec, marginBottom:'6px', fontWeight:600 }}>Password</label>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.cyan}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>

            {error && <p style={{ color: C.red, fontSize:'13px', padding:'10px 12px', background:`${C.red}15`, borderRadius:'8px' }}>{error}</p>}
            {success && <p style={{ color: C.green, fontSize:'13px', padding:'10px 12px', background:`${C.green}15`, borderRadius:'8px' }}>{success}</p>}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'16px', background: loading ? C.bgElevated : C.cyan,
              color: loading ? C.textMuted : C.textInv, border:'none', borderRadius:'10px',
              fontSize:'16px', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
              transition:'background 150ms', marginTop:'8px',
            }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

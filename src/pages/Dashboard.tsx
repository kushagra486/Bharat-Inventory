import { useEffect, useState } from 'react';
import { Plus, Bell, RefreshCw } from 'lucide-react';
import { C } from '../lib/tokens';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats, getProducts, getProductsByCategory } from '../lib/db';
import { expiryLabel, statusColor, fmtDate } from '../lib/utils';
import { Product, DashboardStats } from '../types';
import StatCard from '../components/StatCard';
import { Page } from '../App';

export default function Dashboard({ nav }: { nav: (p: Page, opts?: any) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ total:0, expired:0, expiring_today:0, expiring_soon:0, safe:0 });
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [catStats, setCatStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [s, prods, cats] = await Promise.all([getDashboardStats(), getProducts(), getProductsByCategory()]);
    setStats(s);
    setAlerts(prods.filter(p => p.expiry_status === 'expired' || p.expiry_status === 'today' || p.expiry_status === 'soon').slice(0, 5));
    setCatStats(cats.slice(0, 6));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function refresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.user_metadata?.full_name as string)?.split(' ')[0] ?? 'there';

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color: C.cyan }}>Loading…</div>
  );

  return (
    <div style={{ padding:'20px', paddingTop:'calc(20px + env(safe-area-inset-top))' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color: C.text }}>{greeting}, {firstName} 👋</h1>
          <p style={{ color: C.textSec, fontSize:'13px', marginTop:'2px' }}>Here's your inventory status</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={refresh} style={{ background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'10px', width:'44px', height:'44px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: C.textSec }}>
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          {alerts.length > 0 && (
            <button style={{ background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'10px', width:'44px', height:'44px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: C.textSec, position:'relative' }}>
              <Bell size={18} />
              <span style={{ position:'absolute', top:'6px', right:'6px', width:'16px', height:'16px', borderRadius:'50%', background: C.red, fontSize:'9px', fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{alerts.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'24px' }}>
        <StatCard label="Total" value={stats.total} color={C.cyan} />
        <StatCard label="Expired" value={stats.expired} color={C.red} onClick={() => nav('products')} />
        <StatCard label="Today" value={stats.expiring_today} color={C.orange} onClick={() => nav('products')} />
        <StatCard label="Soon" value={stats.expiring_soon} color={C.yellow} onClick={() => nav('products')} />
        <StatCard label="Safe" value={stats.safe} color={C.green} />
        <button onClick={() => nav('add-hub')} style={{
          background:`${C.cyan}15`, borderRadius:'12px', border:`1px dashed ${C.cyan}40`,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:'4px', cursor:'pointer', minHeight:'44px', flex:1,
          transition:'background 150ms',
        }}>
          <Plus size={22} color={C.cyan} />
          <span style={{ fontSize:'11px', color: C.cyan, fontWeight:600 }}>Add</span>
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section style={{ marginBottom:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <h2 style={{ fontSize:'16px', fontWeight:700, color: C.text }}>⚠️ Alerts</h2>
            <button onClick={() => nav('products')} style={{ background:'none', border:'none', color: C.cyan, fontSize:'13px', cursor:'pointer' }}>See all</button>
          </div>
          <div style={{ background: C.bgCard, borderRadius:'12px', border:`1px solid ${C.border}`, overflow:'hidden' }}>
            {alerts.map((p, i) => {
              const col = statusColor(p.expiry_status!);
              return (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', borderBottom: i < alerts.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: col, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'14px', fontWeight:600, color: C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</p>
                    <p style={{ fontSize:'12px', color: col, marginTop:'2px' }}>{expiryLabel(p.expiry_date)}</p>
                  </div>
                  <span style={{ fontSize:'20px' }}>{p.category?.icon ?? '📦'}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Categories */}
      {catStats.length > 0 && (
        <section style={{ marginBottom:'24px' }}>
          <h2 style={{ fontSize:'16px', fontWeight:700, color: C.text, marginBottom:'12px' }}>📊 Categories</h2>
          <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'4px' }}>
            {catStats.map((cat, i) => (
              <div key={i} style={{ background: C.bgCard, borderRadius:'20px', border:`1px solid ${cat.color}30`, padding:'8px 14px', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap', flexShrink:0 }}>
                <span style={{ fontSize:'18px' }}>{cat.icon}</span>
                <span style={{ fontSize:'13px', color: C.textSec }}>{cat.name}</span>
                <span style={{ fontSize:'13px', fontWeight:700, color: cat.color }}>{cat.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

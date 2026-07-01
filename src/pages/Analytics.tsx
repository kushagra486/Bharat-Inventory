import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import { C } from '../lib/tokens';
import { getProducts, getProductsByCategory } from '../lib/db';
import { Page } from '../App';

export default function AnalyticsPage({ nav }: { nav: (p: Page) => void }) {
  const [catData, setCatData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([getProductsByCategory(), getProducts()]).then(([cats, prods]) => {
      setCatData(cats.slice(0,6).map(c => ({ name: c.icon+' '+c.name, value: c.count, fill: c.color })));
      setStatusData([
        { name:'Expired', value: prods.filter(p => p.expiry_status==='expired').length, fill: C.red },
        { name:'Today', value: prods.filter(p => p.expiry_status==='today').length, fill: C.orange },
        { name:'Soon', value: prods.filter(p => p.expiry_status==='soon').length, fill: C.yellow },
        { name:'Safe', value: prods.filter(p => p.expiry_status==='safe').length, fill: C.green },
      ]);
    });
  }, []);

  return (
    <div>
      <Header title="Analytics" />
      <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'24px' }}>
        <section>
          <h2 style={{ fontSize:'16px', fontWeight:700, color: C.text, marginBottom:'16px' }}>Status Overview</h2>
          <div style={{ background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'14px', padding:'20px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => value ? `${name} ${value}` : ''}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'8px', color: C.text }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section>
          <h2 style={{ fontSize:'16px', fontWeight:700, color: C.text, marginBottom:'16px' }}>By Category</h2>
          <div style={{ background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'14px', padding:'20px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData} layout="vertical" margin={{ left:8, right:16 }}>
                <XAxis type="number" stroke={C.textMuted} tick={{ fill: C.textMuted, fontSize:11 }} />
                <YAxis type="category" dataKey="name" width={100} stroke={C.textMuted} tick={{ fill: C.textSec, fontSize:12 }} />
                <Tooltip contentStyle={{ background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'8px', color: C.text }} />
                <Bar dataKey="value" radius={[0,4,4,0]}>
                  {catData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

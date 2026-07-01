import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import { C } from '../lib/tokens';
import { getProducts } from '../lib/db';
import { statusColor } from '../lib/utils';
import { Product } from '../types';
import { Page } from '../App';

export default function CalendarPage({ nav }: { nav: (p: Page) => void }) {
  const [date, setDate] = useState(new Date());
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { getProducts().then(setProducts); }, []);

  const year = date.getFullYear(), month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const monthName = date.toLocaleString('default', { month:'long', year:'numeric' });

  const byDay: Record<number, Product[]> = {};
  products.forEach(p => {
    const d = new Date(p.expiry_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(p);
    }
  });

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <div>
      <Header title="Calendar" />
      <div style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <button onClick={() => setDate(new Date(year, month-1, 1))} style={{ background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: C.text }}>
            <ChevronLeft size={18} />
          </button>
          <p style={{ fontWeight:700, color: C.text, fontSize:'16px' }}>{monthName}</p>
          <button onClick={() => setDate(new Date(year, month+1, 1))} style={{ background: C.bgCard, border:`1px solid ${C.border}`, borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: C.text }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'8px' }}>
          {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} style={{ textAlign:'center', fontSize:'12px', color: C.textMuted, padding:'4px' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
          {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} />)}
          {Array.from({length: daysInMonth}).map((_,i) => {
            const day = i+1;
            const dayProds = byDay[day] ?? [];
            const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===day;
            const isSelected = selectedDay === day;
            const worstStatus = dayProds.reduce((worst, p) => {
              const order = ['expired','today','soon','safe'];
              return order.indexOf(p.expiry_status!) < order.indexOf(worst) ? p.expiry_status! : worst;
            }, 'safe' as any);
            return (
              <button key={day} onClick={() => setSelectedDay(day === selectedDay ? null : day)} style={{
                aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                borderRadius:'8px', border:`1px solid ${isSelected ? C.cyan : isToday ? C.cyan+'40' : C.border}`,
                background: isSelected ? `${C.cyan}20` : isToday ? `${C.cyan}10` : C.bgCard,
                cursor:'pointer', gap:'2px', position:'relative',
              }}>
                <span style={{ fontSize:'13px', fontWeight: isToday ? 800 : 500, color: isToday ? C.cyan : C.text }}>{day}</span>
                {dayProds.length > 0 && (
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: statusColor(worstStatus) }} />
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && byDay[selectedDay] && (
          <div style={{ marginTop:'20px', display:'flex', flexDirection:'column', gap:'8px' }}>
            <p style={{ fontWeight:700, color: C.text, fontSize:'15px' }}>Expiring on {selectedDay} {monthName.split(' ')[0]}</p>
            {byDay[selectedDay].map(p => {
              const col = statusColor(p.expiry_status!);
              return (
                <div key={p.id} style={{ background: C.bgCard, border:`1px solid ${col}30`, borderLeft:`3px solid ${col}`, borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'22px' }}>{p.category?.icon ?? '📦'}</span>
                  <div>
                    <p style={{ fontWeight:600, color: C.text, fontSize:'14px' }}>{p.name}</p>
                    <p style={{ fontSize:'12px', color: C.textMuted }}>{p.quantity} {p.unit}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

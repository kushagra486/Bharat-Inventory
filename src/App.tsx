import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/Products';
import AddHub from './pages/AddHub';
import AddManual from './pages/AddManual';
import ScanPage from './pages/Scan';
import OcrPage from './pages/OcrScan';
import ImportPage from './pages/Import';
import AnalyticsPage from './pages/Analytics';
import CalendarPage from './pages/Calendar';
import BottomNav from './components/BottomNav';

export type Page = 'dashboard' | 'products' | 'add-hub' | 'add-manual' | 'scan' | 'ocr' | 'import' | 'analytics' | 'calendar';

function Inner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [editId, setEditId] = useState<string | undefined>();
  const [prefill, setPrefill] = useState<Record<string, string>>({});

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', color:'#00D4FF', fontSize:'1.2rem' }}>Loading…</div>;
  if (!user) return <LoginPage />;

  const nav = (p: Page, opts?: { editId?: string; prefill?: Record<string, string> }) => {
    setEditId(opts?.editId);
    setPrefill(opts?.prefill ?? {});
    setPage(p);
  };

  const showNav = ['dashboard','products','analytics','calendar'].includes(page);

  return (
    <div style={{ minHeight:'100dvh', background:'#0A0E1A', display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, overflowY:'auto', paddingBottom: showNav ? '72px' : 0 }}>
        {page === 'dashboard' && <Dashboard nav={nav} />}
        {page === 'products' && <ProductsPage nav={nav} />}
        {page === 'add-hub' && <AddHub nav={nav} />}
        {page === 'add-manual' && <AddManual nav={nav} editId={editId} prefill={prefill} />}
        {page === 'scan' && <ScanPage nav={nav} />}
        {page === 'ocr' && <OcrPage nav={nav} />}
        {page === 'import' && <ImportPage nav={nav} />}
        {page === 'analytics' && <AnalyticsPage nav={nav} />}
        {page === 'calendar' && <CalendarPage nav={nav} />}
      </div>
      {showNav && <BottomNav current={page} nav={nav} />}
    </div>
  );
}

export default function App() {
  return <AuthProvider><Inner /></AuthProvider>;
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { WorldsPage } from './pages/WorldsPage';
import { EntityWorkspace } from './pages/EntityWorkspace';
import { AuthProvider } from './contexts/AuthContext';
import { DebugProvider } from './contexts/DebugContext';

function App() {
  return (
    <DebugProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
          <Route path="/worlds" element={<AppLayout><WorldsPage /></AppLayout>} />
          <Route path="/view/:type/:id" element={<AppLayout hasNavbar><EntityWorkspace /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </DebugProvider>
  )
}

export default App;

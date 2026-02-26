import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login'; 
import ConfigurarPerfil from './Dashboard/ConfigurarPerfil';
import DashboardHome from './Dashboard/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal: El inicio de sesión */}
        <Route path="/" element={<Login />} />
        
        {/* Ruta para usuarios nuevos */}
        <Route path="/configurar-perfil" element={<ConfigurarPerfil />} />
        
        {/* Ruta principal del sistema (donde están todos tus módulos) */}
        <Route path="/dashboard" element={<DashboardHome />} />

        {/* 🟢 RUTA SALVAVIDAS: Si se pierde, te regresa al Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Importamos el sistema de navegación
import './index.css';

// Importamos tus dos pantallas
import App from './App.tsx';
import DashboardHome from './Dashboard/Home.tsx'; // Importamos la nueva carpeta que creaste

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Envolvemos toda la app en BrowserRouter para activar la navegación */}
    <BrowserRouter>
      <Routes>
        {/* RUTA 1: La raíz (/) muestra el Login (App) */}
        <Route path="/" element={<App />} />

        {/* RUTA 2: /dashboard muestra el Panel Principal */}
        <Route path="/dashboard" element={<DashboardHome />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

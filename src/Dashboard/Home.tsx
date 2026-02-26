import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

// Importamos todas nuestras "piezas de lego"
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import TableroInicio from './TableroInicio';
import CreateReport from './CreateReport'; 
import RegistroHoras from './RegistroHoras'; 
import Notificaciones from './Notificaciones'; 

type ViewType = 'dashboard' | 'create' | 'view' | 'registro_horas' | 'notificaciones';

export default function DashboardHome() {
  const [showConstruction, setShowConstruction] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [reporteSeleccionadoId, setReporteSeleccionadoId] = useState<number | null>(null);
  
  const [reportesBorrador, setReportesBorrador] = useState<any[]>([]);
  const [reportesCompletados, setReportesCompletados] = useState<any[]>([]);

  const userEmail = 'becario@alam.mx'; // En el futuro esto vendrá del Login

  const handleConstruction = () => setShowConstruction(true);
  const closeConstruction = () => setShowConstruction(false);

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchReportes();
      setReporteSeleccionadoId(null); 
    }
  }, [currentView]);

  const fetchReportes = async () => {
    try {
      const { data, error } = await supabase.from('reportes').select('*').eq('email', userEmail).order('numero_reporte', { ascending: false });
      if (error) throw error;
      if (data) {
        setReportesBorrador(data.filter((r) => r.estado === 'borrador'));
        setReportesCompletados(data.filter((r) => r.estado === 'completado'));
      }
    } catch (error) { console.error('Error cargando reportes:', error); }
  };

  const verReportePasado = (id: number) => {
    setReporteSeleccionadoId(id);
    setCurrentView('view');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* 1. PIEZA: BARRA LATERAL */}
      <Sidebar 
        userEmail={userEmail} 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        handleConstruction={handleConstruction} 
      />

      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* 2. PIEZA: CABECERA */}
        <TopHeader 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          handleConstruction={handleConstruction} 
        />

        {/* 3. PIEZA: CONTENIDO PRINCIPAL (Cambia según la vista) */}
        {currentView === 'registro_horas' ? (
          <RegistroHoras userEmail={userEmail} />
        ) : currentView === 'notificaciones' ? (
          <Notificaciones userEmail={userEmail} />
        ) : currentView === 'dashboard' ? (
          <TableroInicio 
            reportesBorrador={reportesBorrador} 
            reportesCompletados={reportesCompletados} 
            setCurrentView={setCurrentView} 
            verReportePasado={verReportePasado} 
          />
        ) : (
          <CreateReport
            onBack={() => { setCurrentView('dashboard'); fetchReportes(); }}
            userEmail={userEmail}
            reporteIdParaVer={reporteSeleccionadoId}
          />
        )}
      </main>

      {/* MODAL DE CONSTRUCCIÓN */}
      {showConstruction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm border-t-4 border-yellow-500">
            <div className="text-6xl mb-4 animate-spin-slow">⚙️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Estamos trabajando en esto</h2>
            <p className="text-gray-600 mb-6">Próximamente disponible.</p>
            <button onClick={closeConstruction} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded transition">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}
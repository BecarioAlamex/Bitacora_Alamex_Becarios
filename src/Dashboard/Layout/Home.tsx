import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 
import { registrarEntradaActual } from '../../services/asistenciaService';

// Importaciones de módulos
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import TableroInicio from '../ModuloInicio/TableroInicio';
import RegistroHoras from '../ModuloInicio/RegistroHoras'; 
import CreateReport from '../ModulosReportes/CreateReport'; 
import Notificaciones from '../notificaciones/Notificaciones'; 
import AdminUsuariosPrincipal from '../ModuloAdminUsuarios/AdminUsuariosPrincipal';

type ViewType = 'dashboard' | 'create' | 'view' | 'registro_horas' | 'notificaciones' | 'admin_usuarios';

export default function DashboardHome() {
  const [showConstruction, setShowConstruction] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [reporteSeleccionadoId, setReporteSeleccionadoId] = useState<number | null>(null);
  const [reportesBorrador, setReportesBorrador] = useState<any[]>([]);
  const [reportesCompletados, setReportesCompletados] = useState<any[]>([]);

  const userEmail = 'becario@alam.mx'; 

  useEffect(() => {
    if (userEmail) registrarEntradaActual(userEmail);
  }, [userEmail]);

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
      <Sidebar 
        userEmail={userEmail} 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        handleConstruction={handleConstruction} 
      />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <TopHeader 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          handleConstruction={handleConstruction} 
        />

        <section className="flex-1 p-4">
          {/* LOGICA DE ENRUTAMIENTO CORREGIDA */}
          {currentView === 'admin_usuarios' ? (
            <AdminUsuariosPrincipal />
          ) : currentView === 'registro_horas' ? (
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
        </section>
      </main>

      {showConstruction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm border-t-8 border-yellow-500">
            <div className="text-7xl mb-4">⚙️</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Módulo en Desarrollo</h2>
            <p className="text-slate-600 mb-8 font-medium">Esta función estará disponible próximamente.</p>
            <button onClick={closeConstruction} className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-black py-3 rounded-xl transition-all shadow-lg">¡ENTENDIDO!</button>
          </div>
        </div>
      )}
    </div>
  );
}
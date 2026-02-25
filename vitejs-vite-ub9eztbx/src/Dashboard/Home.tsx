import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateReport from './CreateReport';
import RegistroHoras from './RegistroHoras';
import Notificaciones from './Notificaciones';
import { supabase } from '../supabaseClient';

export default function DashboardHome() {
  const navigate = useNavigate();
  const [showConstruction, setShowConstruction] = useState(false);

  const [currentView, setCurrentView] = useState<
    'dashboard' | 'create' | 'view' | 'registro_horas' | 'notificaciones'
  >('dashboard');
  const [reporteSeleccionadoId, setReporteSeleccionadoId] = useState<
    number | null
  >(null);

  const [reportesBorrador, setReportesBorrador] = useState<any[]>([]);
  const [reportesCompletados, setReportesCompletados] = useState<any[]>([]);

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
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .eq('email', 'becario@alam.mx')
        .order('numero_reporte', { ascending: false });

      if (error) throw error;

      if (data) {
        setReportesBorrador(data.filter((r) => r.estado === 'borrador'));
        setReportesCompletados(data.filter((r) => r.estado === 'completado'));
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
    }
  };

  const verReportePasado = (id: number) => {
    setReporteSeleccionadoId(id);
    setCurrentView('view');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* BARRA LATERAL */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col p-4 shadow-xl z-10 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10 p-2 bg-slate-700 rounded-lg">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg">
            U
          </div>
          <div>
            <p className="font-bold text-sm">Usuario Actual</p>
            <p className="text-xs text-gray-300">becario@alam.mx</p>
          </div>
        </div>
        <nav className="flex flex-col gap-4 flex-1">
          <p className="text-xs text-gray-400 font-bold uppercase ml-2">
            Menú Principal
          </p>

          <button
            onClick={() => setCurrentView('dashboard')}
            className={`p-3 text-left rounded transition flex items-center gap-2 ${
              currentView === 'dashboard'
                ? 'bg-blue-600'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            🏠 INICIO
          </button>

          <button
            onClick={() => setCurrentView('registro_horas')}
            className={`p-3 text-left rounded transition flex items-center gap-2 ${
              currentView === 'registro_horas'
                ? 'bg-blue-600'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            🕒 REGISTRO DE HORAS
          </button>

          <button
            onClick={handleConstruction}
            className="p-3 text-left bg-slate-700 hover:bg-slate-600 rounded transition flex items-center gap-2"
          >
            🚫 REPORTE DE FALTAS
          </button>
          <button
            onClick={handleConstruction}
            className="p-3 text-left bg-slate-700 hover:bg-slate-600 rounded transition flex items-center gap-2"
          >
            📷 EVIDENCIA FOTOGRÁFICA
          </button>

          <div className="mt-auto flex flex-col gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-3 text-left hover:bg-red-600 rounded transition text-sm flex items-center gap-2 font-bold text-red-200"
            >
              ⬅ Cerrar Sesión
            </button>

            <button
              onClick={() => setCurrentView('notificaciones')}
              className={`p-3 text-left rounded transition text-sm flex items-center gap-2 font-bold border-t border-slate-600 pt-4 mt-2 ${
                currentView === 'notificaciones'
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-yellow-400'
              }`}
            >
              🔔 Ver Notificaciones
            </button>
          </div>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-700 ml-4">
            {currentView === 'dashboard'
              ? 'Tablero de Reportes'
              : currentView === 'view'
              ? 'Visualizando Reporte Histórico'
              : currentView === 'registro_horas'
              ? 'Control de Horas'
              : currentView === 'notificaciones'
              ? 'Centro de Notificaciones'
              : 'Módulo de Reportes'}
          </h1>

          {currentView === 'dashboard' && (
            <div className="flex gap-4 mr-4">
              <button
                onClick={() => setCurrentView('create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow transition transform hover:scale-105"
              >
                + COMENZAR / CONTINUAR REPORTE
              </button>

              <button
                onClick={handleConstruction}
                className="border border-gray-400 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                🔧 ADMINISTRAR USUARIOS
              </button>
            </div>
          )}
        </header>

        {currentView === 'registro_horas' ? (
          <RegistroHoras userEmail="becario@alam.mx" />
        ) : currentView === 'notificaciones' ? (
          <Notificaciones userEmail="becario@alam.mx" />
        ) : currentView === 'dashboard' ? (
          <div className="p-8">
            <div className="mb-10">
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b-2 border-blue-200 pb-2">
                EN ESTE APARTADO SE VERÁN LOS REPORTES QUE ESTÁN EN PROCESO DE
                LLENADO
              </h2>

              {reportesBorrador.length === 0 ? (
                <p className="text-gray-400 italic text-sm">
                  No tienes ningún reporte en proceso actualmente.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {reportesBorrador.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setCurrentView('create')}
                      className="bg-blue-50 p-6 rounded-xl shadow border border-blue-200 flex flex-col items-center justify-center h-48 hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1"
                    >
                      <span className="text-4xl font-bold text-blue-300 mb-2">
                        📝
                      </span>
                      <p className="font-bold text-gray-800">
                        Reporte #{item.numero_reporte}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.periodo_semana}
                      </p>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-3 font-bold border border-yellow-300">
                        ⏳ En Proceso
                      </span>
                      <p className="text-xs text-blue-600 mt-2 hover:underline">
                        Continuar llenando ➔
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4 border-b-2 border-gray-200 pb-2">
                Historial de Reportes Finalizados
              </h2>

              {reportesCompletados.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                  <p>📭 Aún no has finalizado ningún reporte.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {reportesCompletados.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => verReportePasado(item.id)}
                      className="bg-white p-6 rounded-xl shadow border border-gray-200 flex flex-col items-center justify-center h-48 hover:shadow-lg hover:border-green-300 transition cursor-pointer transform hover:-translate-y-1"
                    >
                      <span className="text-4xl font-bold text-gray-200 mb-2">
                        📄
                      </span>
                      <p className="font-bold text-gray-700">
                        Reporte #{item.numero_reporte}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.periodo_semana}
                      </p>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-3 font-bold">
                        ✅ Completado
                      </span>
                      <p className="text-xs text-gray-400 mt-2 hover:underline">
                        Ver detalles 👁️
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <CreateReport
            onBack={() => {
              setCurrentView('dashboard');
              fetchReportes();
            }}
            userEmail="becario@alam.mx"
            reporteIdParaVer={reporteSeleccionadoId}
          />
        )}
      </main>

      {showConstruction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm border-t-4 border-yellow-500">
            <div className="text-6xl mb-4 animate-spin-slow">⚙️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Estamos trabajando en esto
            </h2>
            <p className="text-gray-600 mb-6">Próximamente disponible.</p>
            <button
              onClick={closeConstruction}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

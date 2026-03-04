import { useNavigate } from 'react-router-dom';

// Actualizamos el tipo para incluir la nueva vista
type ViewType = 'dashboard' | 'create' | 'view' | 'registro_horas' | 'notificaciones' | 'admin_usuarios';

interface SidebarProps {
  userEmail: string;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  handleConstruction: () => void;
}

export default function Sidebar({ userEmail, currentView, setCurrentView, handleConstruction }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col p-4 shadow-xl z-10 overflow-y-auto">
      <div className="flex items-center gap-3 mb-10 p-2 bg-slate-700 rounded-lg">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg">U</div>
        <div>
          <p className="font-bold text-sm">Usuario Actual</p>
          <p className="text-xs text-gray-300">{userEmail}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-4 flex-1">
        <p className="text-xs text-gray-400 font-bold uppercase ml-2">Menú Principal</p>
        
        <button onClick={() => setCurrentView('dashboard')} className={`p-3 text-left rounded transition flex items-center gap-2 ${currentView === 'dashboard' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          🏠 INICIO
        </button>

        <button onClick={() => setCurrentView('registro_horas')} className={`p-3 text-left rounded transition flex items-center gap-2 ${currentView === 'registro_horas' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          🕒 REGISTRO DE HORAS
        </button>

        {/* BOTÓN ADMINISTRAR USUARIOS - Corregido con estilo del menú */}
        <button onClick={() => setCurrentView('admin_usuarios')} className={`p-3 text-left rounded transition flex items-center gap-2 ${currentView === 'admin_usuarios' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          🔧 ADMINISTRAR USUARIOS
        </button>
        
        <button onClick={handleConstruction} className="p-3 text-left bg-slate-700 hover:bg-slate-600 rounded transition flex items-center gap-2">
          🚫 REPORTE DE FALTAS
        </button>
        
        <button onClick={handleConstruction} className="p-3 text-left bg-slate-700 hover:bg-slate-600 rounded transition flex items-center gap-2">
          📷 EVIDENCIA FOTOGRÁFICA
        </button>
        
        <div className="mt-auto flex flex-col gap-2">
          <button onClick={() => navigate('/')} className="p-3 text-left hover:bg-red-600 rounded transition text-sm flex items-center gap-2 font-bold text-red-200">
            ⬅ Cerrar Sesión
          </button>
          
          <button onClick={() => setCurrentView('notificaciones')} className={`p-3 text-left rounded transition text-sm flex items-center gap-2 font-bold border-t border-slate-600 pt-4 mt-2 ${currentView === 'notificaciones' ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}>
            🔔 Ver Notificaciones
          </button>
        </div>
      </nav>
    </aside>
  );
}
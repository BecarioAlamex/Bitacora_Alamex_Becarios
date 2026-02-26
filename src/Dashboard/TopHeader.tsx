type ViewType = 'dashboard' | 'create' | 'view' | 'registro_horas' | 'notificaciones';

interface TopHeaderProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  handleConstruction: () => void;
}

export default function TopHeader({ currentView, setCurrentView, handleConstruction }: TopHeaderProps) {
  return (
    <header className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
      <h1 className="text-2xl font-bold text-gray-700 ml-4">
        {currentView === 'dashboard' ? 'Tablero de Reportes' : 
         currentView === 'view' ? 'Visualizando Reporte Histórico' : 
         currentView === 'registro_horas' ? 'Control de Horas' : 
         currentView === 'notificaciones' ? 'Centro de Notificaciones' : 'Módulo de Reportes'}
      </h1>
      
      {currentView === 'dashboard' && (
        <div className="flex gap-4 mr-4">
          <button onClick={() => setCurrentView('create')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow transition transform hover:scale-105">
            + COMENZAR / CONTINUAR REPORTE
          </button>
          <button onClick={handleConstruction} className="border border-gray-400 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
            🔧 ADMINISTRAR USUARIOS
          </button>
        </div>
      )}
    </header>
  );
}
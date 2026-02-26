type ViewType = 'dashboard' | 'create' | 'view' | 'registro_horas' | 'notificaciones';

interface TableroInicioProps {
  reportesBorrador: any[];
  reportesCompletados: any[];
  setCurrentView: (view: ViewType) => void;
  verReportePasado: (id: number) => void;
}

export default function TableroInicio({ reportesBorrador, reportesCompletados, setCurrentView, verReportePasado }: TableroInicioProps) {
  return (
    <div className="p-8">
      <div className="mb-10">
        <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b-2 border-blue-200 pb-2">
          EN ESTE APARTADO SE VERÁN LOS REPORTES QUE ESTÁN EN PROCESO DE LLENADO
        </h2>
        
        {reportesBorrador.length === 0 ? (
          <p className="text-gray-400 italic text-sm">No tienes ningún reporte en proceso actualmente.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {reportesBorrador.map((item) => (
              <div key={item.id} onClick={() => setCurrentView('create')} className="bg-blue-50 p-6 rounded-xl shadow border border-blue-200 flex flex-col items-center justify-center h-48 hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1">
                <span className="text-4xl font-bold text-blue-300 mb-2">📝</span>
                <p className="font-bold text-gray-800">Reporte #{item.numero_reporte}</p>
                <p className="text-xs text-gray-500 mt-1">{item.periodo_semana}</p>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-3 font-bold border border-yellow-300">⏳ En Proceso</span>
                <p className="text-xs text-blue-600 mt-2 hover:underline">Continuar llenando ➔</p>
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
              <div key={item.id} onClick={() => verReportePasado(item.id)} className="bg-white p-6 rounded-xl shadow border border-gray-200 flex flex-col items-center justify-center h-48 hover:shadow-lg hover:border-green-300 transition cursor-pointer transform hover:-translate-y-1">
                <span className="text-4xl font-bold text-gray-200 mb-2">📄</span>
                <p className="font-bold text-gray-700">Reporte #{item.numero_reporte}</p>
                <p className="text-xs text-gray-500 mt-1">{item.periodo_semana}</p>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-3 font-bold">✅ Completado</span>
                <p className="text-xs text-gray-400 mt-2 hover:underline">Ver detalles 👁️</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
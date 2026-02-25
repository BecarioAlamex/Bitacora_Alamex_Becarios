import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface NotificacionesProps {
  userEmail: string;
}

export default function Notificaciones({ userEmail }: NotificacionesProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs_sistema')
        .select('*')
        .eq('usuario_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setLogs(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Notificaciones del Sistema
          </h2>
          <p className="text-gray-500 text-sm">
            Historial de acciones y registro de errores de la plataforma.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-bold flex gap-2 items-center"
        >
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 font-bold animate-pulse mt-10">
          Cargando registros...
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow border border-gray-200 text-center">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-gray-500 font-bold">
            No hay notificaciones ni errores registrados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b">
              <tr>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Tipo / Acción</th>
                <th className="px-6 py-4">Detalles del Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const esError = log.accion.toLowerCase().includes('error');
                return (
                  <tr
                    key={log.id}
                    className={`border-b last:border-0 hover:bg-slate-50 transition ${
                      esError ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {formatearFecha(log.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full font-bold text-xs ${
                          esError
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {esError ? '⚠️ ' : '✅ '}
                        {log.accion}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        esError ? 'text-red-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {log.detalles}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface RegistroHorasProps {
  userEmail: string;
}

export default function RegistroHoras({ userEmail }: RegistroHorasProps) {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [totalHorasCompletadas, setTotalHorasCompletadas] = useState(0);

  // Estadísticas para las gráficas
  const [llegadasTemprano, setLlegadasTemprano] = useState(0);
  const [salidasTarde, setSalidasTarde] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  const calcularDiferenciaMinutos = (hora1: string, hora2: string) => {
    if (!hora1 || !hora2) return 0;
    const [h1, m1] = hora1.split(':').map(Number);
    const [h2, m2] = hora2.split(':').map(Number);
    return h1 * 60 + m1 - (h2 * 60 + m2);
  };

  const cargarDatos = async () => {
    try {
      // 1. Obtener datos del perfil (Nombre y Horarios fijos)
      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      if (perfilData) setPerfil(perfilData);

      // 2. Obtener reportes finalizados
      const { data: reportes } = await supabase
        .from('reportes')
        .select('id, periodo_semana')
        .eq('email', userEmail)
        .eq('estado', 'completado');

      if (!reportes || reportes.length === 0) {
        setLoading(false);
        return;
      }

      const reportesIds = reportes.map((r) => r.id);

      // 3. Obtener horas de esos reportes
      const { data: horas } = await supabase
        .from('hrs_entrada_y_hrs_salida')
        .select('*')
        .in('reporte_id', reportesIds);

      let sumaTotal = 0;
      let early = 0;
      let late = 0;
      const dataCombinada = [];

      for (const rep of reportes) {
        const h = horas?.find((hr) => hr.reporte_id === rep.id);
        const totalSemana = h ? h.total_semana : 0;
        sumaTotal += totalSemana;

        dataCombinada.push({
          periodo: rep.periodo_semana,
          horas: totalSemana,
          restantes: 480 - sumaTotal,
        });

        // Calculando llegadas temprano y salidas tarde comparando con el horario fijo
        if (
          h &&
          perfilData?.hora_entrada_establecida &&
          perfilData?.hora_salida_establecida
        ) {
          const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
          dias.forEach((dia) => {
            const entradaReal = h[`entrada_${dia}`];
            const salidaReal = h[`salida_${dia}`];

            if (
              entradaReal &&
              calcularDiferenciaMinutos(
                perfilData.hora_entrada_establecida,
                entradaReal
              ) > 0
            )
              early++;
            if (
              salidaReal &&
              calcularDiferenciaMinutos(
                salidaReal,
                perfilData.hora_salida_establecida
              ) > 0
            )
              late++;
          });
        }
      }

      setRegistros(dataCombinada);
      setTotalHorasCompletadas(sumaTotal);
      setLlegadasTemprano(early);
      setSalidasTarde(late);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 font-bold animate-pulse">
        Cargando métricas de horas...
      </div>
    );

  const horasRestantes = 480 - totalHorasCompletadas;
  const porcentajeAvance = Math.min(
    (totalHorasCompletadas / 480) * 100,
    100
  ).toFixed(1);

  return (
    <div className="p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-8 rounded-2xl shadow-xl text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">
            Bienvenido al registro de horas,{' '}
            {perfil?.nombre_completo || 'Becario'}! 👋
          </h2>
          <p className="text-slate-300">
            Aquí puedes monitorear tu progreso hacia tu meta de liberación de
            servicio.
          </p>
        </div>
        <div className="absolute top-0 right-0 opacity-10 text-9xl transform translate-x-4 -translate-y-8">
          ⏱️
        </div>
      </div>

      {/* TARJETAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-gray-500 font-bold text-sm">HORAS COMPLETADAS</p>
          <p className="text-4xl font-bold text-blue-700 mt-2">
            {totalHorasCompletadas.toFixed(2)}{' '}
            <span className="text-lg text-gray-400">hrs</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
          <p className="text-gray-500 font-bold text-sm">HORAS RESTANTES</p>
          <p className="text-4xl font-bold text-yellow-600 mt-2">
            {horasRestantes > 0 ? horasRestantes.toFixed(2) : 0}{' '}
            <span className="text-lg text-gray-400">hrs</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-gray-500 font-bold text-sm">
            PROGRESO TOTAL (480 HRS)
          </p>
          <p className="text-4xl font-bold text-green-600 mt-2">
            {porcentajeAvance}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
            <div
              className="bg-green-500 h-2.5 rounded-full"
              style={{ width: `${porcentajeAvance}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* GRÁFICAS DE COMPORTAMIENTO (1 Columna) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 text-sm tracking-widest uppercase border-b pb-2">
              Métricas de Puntualidad
            </h3>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-emerald-600">
                  Llegadas Temprano
                </span>
                <span className="text-gray-500">{llegadasTemprano} veces</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-emerald-400 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(llegadasTemprano * 5, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-orange-500">
                  Salidas Después de Hora
                </span>
                <span className="text-gray-500">{salidasTarde} veces</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-orange-400 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(salidasTarde * 5, 100)}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center italic">
              *Calculado en base a tu horario fijo:{' '}
              {perfil?.hora_entrada_establecida} -{' '}
              {perfil?.hora_salida_establecida}
            </p>
          </div>
        </div>

        {/* TABLA DE REGISTROS (2 Columnas) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <h3 className="font-bold text-gray-700 p-6 bg-gray-50 border-b text-sm tracking-widest uppercase">
            Historial de Semanas Reportadas
          </h3>

          {registros.length === 0 ? (
            <div className="p-8 text-center text-gray-400 italic">
              No tienes semanas completadas para mostrar en el historial.
              Termina un reporte para ver tus horas aquí.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4 border-b">Periodo Laborado</th>
                    <th className="px-6 py-4 border-b text-center">
                      Horas de Servicio
                    </th>
                    <th className="px-6 py-4 border-b text-center">
                      Horas Pendientes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((reg, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50 transition border-b last:border-0"
                    >
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {reg.periodo}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                          +{reg.horas.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-500">
                        {reg.restantes > 0
                          ? reg.restantes.toFixed(2)
                          : '¡Meta Cumplida!'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

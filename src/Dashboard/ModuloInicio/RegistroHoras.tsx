import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface RegistroHorasProps {
  userEmail: string;
}

export default function RegistroHoras({ userEmail }: RegistroHorasProps) {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [totalHorasCompletadas, setTotalHorasCompletadas] = useState(0);

  const [llegadasTemprano, setLlegadasTemprano] = useState(0);
  const [salidasTarde, setSalidasTarde] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función auxiliar para calcular horas entre dos strings "HH:mm"
  const calcularHorasTranscurridas = (entrada: string, salida: string) => {
    if (!entrada || !salida) return 0;
    const [hEntrada, mEntrada] = entrada.split(':').map(Number);
    const [hSalida, mSalida] = salida.split(':').map(Number);
    
    const inicio = hEntrada + mEntrada / 60;
    const fin = hSalida + mSalida / 60;
    
    const diferencia = fin - inicio;
    return diferencia > 0 ? diferencia : 0;
  };

  const calcularDiferenciaMinutos = (hora1: string, hora2: string) => {
    if (!hora1 || !hora2) return 0;
    const [h1, m1] = hora1.split(':').map(Number);
    const [h2, m2] = hora2.split(':').map(Number);
    return h1 * 60 + m1 - (h2 * 60 + m2);
  };

  const cargarDatos = async () => {
    try {
      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      if (perfilData) setPerfil(perfilData);

      const { data: reportes } = await supabase
        .from('reportes')
        .select('id, periodo_semana, estado')
        .eq('email', userEmail);

      if (!reportes || reportes.length === 0) {
        setLoading(false);
        return;
      }

      const reportesIds = reportes.map((r) => r.id);

      const { data: horas } = await supabase
        .from('hrs_entrada_y_hrs_salida')
        .select('*')
        .in('reporte_id', reportesIds);

      let sumaTotalGeneral = 0;
      let early = 0;
      let late = 0;
      const dataCombinada = [];

      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

      for (const rep of reportes) {
        const h = horas?.find((hr) => hr.reporte_id === rep.id);
        let horasEstaSemana = 0;

        if (h) {
          // Si total_semana existe y es mayor a 0, lo usamos. 
          // Si no, sumamos manualmente las horas de cada día.
          if (h.total_semana && h.total_semana > 0) {
            horasEstaSemana = h.total_semana;
          } else {
            dias.forEach(dia => {
              const entrada = h[`entrada_${dia}`];
              const salida = h[`salida_${dia}`];
              horasEstaSemana += calcularHorasTranscurridas(entrada, salida);
            });
          }

          // Métricas de puntualidad
          if (perfilData?.hora_entrada_establecida && perfilData?.hora_salida_establecida) {
            dias.forEach((dia) => {
              const entradaReal = h[`entrada_${dia}`];
              const salidaReal = h[`salida_${dia}`];

              if (entradaReal && calcularDiferenciaMinutos(perfilData.hora_entrada_establecida, entradaReal) > 0) early++;
              if (salidaReal && calcularDiferenciaMinutos(salidaReal, perfilData.hora_salida_establecida) > 0) late++;
            });
          }
        }

        sumaTotalGeneral += horasEstaSemana;

        dataCombinada.push({
          periodo: rep.periodo_semana,
          horas: horasEstaSemana,
          restantes: 480 - sumaTotalGeneral,
        });
      }

      setRegistros(dataCombinada);
      setTotalHorasCompletadas(sumaTotalGeneral);
      setLlegadasTemprano(early);
      setSalidasTarde(late);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold animate-pulse">Cargando métricas...</div>;

  const horasRestantes = 480 - totalHorasCompletadas;
  const porcentajeAvance = Math.min((totalHorasCompletadas / 480) * 100, 100).toFixed(1);

  return (
    <div className="p-8 animate-fade-in max-w-6xl mx-auto">
      {/* CABECERA */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-8 rounded-2xl shadow-xl text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Bienvenido, {perfil?.nombre_completo || 'Becario'}! 👋</h2>
          <p className="text-slate-300">Progreso de horas de servicio social.</p>
        </div>
      </div>

      {/* TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-gray-500 font-bold text-sm">HORAS COMPLETADAS</p>
          <p className="text-4xl font-bold text-blue-700 mt-2">
            {totalHorasCompletadas.toFixed(2)} <span className="text-lg text-gray-400">hrs</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
          <p className="text-gray-500 font-bold text-sm">HORAS RESTANTES</p>
          <p className="text-4xl font-bold text-yellow-600 mt-2">
            {(horasRestantes > 0 ? horasRestantes : 0).toFixed(2)} <span className="text-lg text-gray-400">hrs</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-gray-500 font-bold text-sm">PROGRESO TOTAL (480 HRS)</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{porcentajeAvance}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${porcentajeAvance}%` }}></div>
          </div>
        </div>
      </div>

      {/* CONTENIDO INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 text-sm tracking-widest uppercase border-b pb-2">Puntualidad</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-emerald-600">Llegadas Temprano</span>
                <span>{llegadasTemprano}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(llegadasTemprano * 10, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-orange-500">Salidas Tarde</span>
                <span>{salidasTarde}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-orange-400 h-full" style={{ width: `${Math.min(salidasTarde * 10, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4 text-center">Horas</th>
                <th className="px-6 py-4 text-center">Pendientes</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((reg, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold">{reg.periodo}</td>
                  <td className="px-6 py-4 text-center"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">+{reg.horas.toFixed(2)}</span></td>
                  <td className="px-6 py-4 text-center text-gray-500">{reg.restantes > 0 ? reg.restantes.toFixed(2) : 'Finalizado'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { generarDocumentoPDF } from './generarPDF'; 

// --- UTILIDADES ---
const obtenerFechasSemana = () => {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diferenciaLunes);
  const fechas: any = {};
  const opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

  for (let i = 0; i < 5; i++) {
    const dia = new Date(lunes);
    dia.setDate(lunes.getDate() + i);
    const nombreDia = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'][i];
    fechas[`fecha_${nombreDia}`] = dia.toLocaleDateString('es-MX', opciones);
    if (i === 0) fechas.inicio = dia.toLocaleDateString('es-MX', opciones);
    if (i === 4) fechas.fin = dia.toLocaleDateString('es-MX', opciones);
  }
  return fechas;
};

const formatTimeAMPM = (timeStr: string) => {
  if (!timeStr) return '';
  let [h, m] = timeStr.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
};

const formatTimeForInput = (t?: string) => (t ? t.substring(0, 5) : '');
const formatForDB = (val: string) => (val && val.trim() !== '' ? val : null);

interface CreateReportProps {
  onBack: () => void;
  userEmail: string;
  reporteIdParaVer?: number | null;
}

export default function CreateReport({ onBack, userEmail, reporteIdParaVer }: CreateReportProps) {
  const esModoLectura = !!reporteIdParaVer;

  const [loading, setLoading] = useState(true);
  const [reporteId, setReporteId] = useState<number | null>(null);
  const [numeroReporte, setNumeroReporte] = useState(1);
  const [perfilDetectado, setPerfilDetectado] = useState<any>(null);
  const [periodoGuardado, setPeriodoGuardado] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isExiting: boolean; } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isExiting: false });
    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, isExiting: true } : null));
      setTimeout(() => setToast(null), 400);
    }, 4500); 
  };

  const [actividades, setActividades] = useState({ lunes: '', martes: '', miercoles: '', jueves: '', viernes: '' });
  const [horas, setHoras] = useState<any>({ 
    entrada_lunes: '', salida_lunes: '', 
    entrada_martes: '', salida_martes: '', 
    entrada_miercoles: '', salida_miercoles: '', 
    entrada_jueves: '', salida_jueves: '', 
    entrada_viernes: '', salida_viernes: '' 
  });
  const [cierre, setCierre] = useState({ aprendizajes: '', dificultades: '', plan_siguiente: '' });

  const fechasSemana = obtenerFechasSemana();

  useEffect(() => {
    cargarDatosReporte();
  }, []);

  const cargarDatosReporte = async () => {
    try {
      const { data: perfil } = await supabase.from('perfiles').select('*').eq('email', userEmail).maybeSingle();
      if (perfil) setPerfilDetectado(perfil);

      let reporteData;
      if (esModoLectura && reporteIdParaVer) {
        const { data } = await supabase.from('reportes').select('*').eq('id', reporteIdParaVer).maybeSingle();
        reporteData = data;
      } else {
        const { data } = await supabase.from('reportes').select('*').eq('email', userEmail).eq('estado', 'borrador').maybeSingle();
        reporteData = data;
      }

      if (reporteData) {
        setReporteId(reporteData.id);
        setNumeroReporte(reporteData.numero_reporte);
        setPeriodoGuardado(reporteData.periodo_semana);

        setActividades({
          lunes: reporteData.actividad_lunes || '', martes: reporteData.actividad_martes || '',
          miercoles: reporteData.actividad_miercoles || '', jueves: reporteData.actividad_jueves || '',
          viernes: reporteData.actividad_viernes || ''
        });

        setCierre({ aprendizajes: reporteData.aprendizajes || '', dificultades: reporteData.dificultades || '', plan_siguiente: reporteData.plan_siguiente_semana || '' });

        const { data: horasData } = await supabase.from('hrs_entrada_y_hrs_salida').select('*').eq('reporte_id', reporteData.id).maybeSingle();
        
        if (horasData) {
          setHoras({
            entrada_lunes: formatTimeForInput(horasData.entrada_lunes), salida_lunes: formatTimeForInput(horasData.salida_lunes),
            entrada_martes: formatTimeForInput(horasData.entrada_martes), salida_martes: formatTimeForInput(horasData.salida_martes),
            entrada_miercoles: formatTimeForInput(horasData.entrada_miercoles), salida_miercoles: formatTimeForInput(horasData.salida_miercoles),
            entrada_jueves: formatTimeForInput(horasData.entrada_jueves), salida_jueves: formatTimeForInput(horasData.salida_jueves),
            entrada_viernes: formatTimeForInput(horasData.entrada_viernes), salida_viernes: formatTimeForInput(horasData.salida_viernes),
          });
        }
      } else {
        const { count } = await supabase.from('reportes').select('*', { count: 'exact', head: true }).eq('email', userEmail).eq('estado', 'completado');
        setNumeroReporte((count || 0) + 1);
        setReporteId(null);
      }
    } catch (error) { console.error('Error cargando reporte:', error); } 
    finally { setLoading(false); }
  };

  const calcularHoras = (entrada: string, salida: string) => {
    if (!entrada || !salida) return 0;
    const [hE, mE] = entrada.split(':').map(Number);
    const [hS, mS] = salida.split(':').map(Number);
    let diff = (hS + mS / 60) - (hE + mE / 60);
    return diff > 0 ? diff : 0;
  };

  const guardarEnBaseDeDatos = async (finalizar = false) => {
    if (esModoLectura) return true;
    setLoading(true);
    try {
      const periodo = `Del ${fechasSemana.inicio} al ${fechasSemana.fin}`;

      const datosReporte = {
        email: userEmail, numero_reporte: numeroReporte, periodo_semana: periodo, estado: finalizar ? 'completado' : 'borrador',
        actividad_lunes: actividades.lunes, actividad_martes: actividades.martes, actividad_miercoles: actividades.miercoles,
        actividad_jueves: actividades.jueves, actividad_viernes: actividades.viernes, aprendizajes: cierre.aprendizajes,
        dificultades: cierre.dificultades, plan_siguiente_semana: cierre.plan_siguiente,
      };

      let currentReporteId = reporteId;

      if (reporteId) {
        const { error } = await supabase.from('reportes').update(datosReporte).eq('id', reporteId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('reportes').insert([datosReporte]).select().single();
        if (error) throw error;
        if (data) { setReporteId(data.id); currentReporteId = data.id; }
      }

      if (currentReporteId) {
        const totalSemana = calcularHoras(horas.entrada_lunes, horas.salida_lunes) + calcularHoras(horas.entrada_martes, horas.salida_martes) + calcularHoras(horas.entrada_miercoles, horas.salida_miercoles) + calcularHoras(horas.entrada_jueves, horas.salida_jueves) + calcularHoras(horas.entrada_viernes, horas.salida_viernes);
        
        const datosHoras = {
          reporte_id: currentReporteId, usuario_email: userEmail, entrada_lunes: formatForDB(horas.entrada_lunes), salida_lunes: formatForDB(horas.salida_lunes),
          entrada_martes: formatForDB(horas.entrada_martes), salida_martes: formatForDB(horas.salida_martes), entrada_miercoles: formatForDB(horas.entrada_miercoles),
          salida_miercoles: formatForDB(horas.salida_miercoles), entrada_jueves: formatForDB(horas.entrada_jueves), salida_jueves: formatForDB(horas.salida_jueves),
          entrada_viernes: formatForDB(horas.entrada_viernes), salida_viernes: formatForDB(horas.salida_viernes), total_semana: parseFloat(totalSemana.toFixed(2)),
        };

        const { data: existHoras } = await supabase.from('hrs_entrada_y_hrs_salida').select('id').eq('reporte_id', currentReporteId).maybeSingle();

        if (existHoras) {
          const { error } = await supabase.from('hrs_entrada_y_hrs_salida').update(datosHoras).eq('id', existHoras.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('hrs_entrada_y_hrs_salida').insert([datosHoras]);
          if (error) throw error;
        }
      }

      await supabase.from('logs_sistema').insert([{ usuario_email: userEmail, accion: finalizar ? 'Finalizó Reporte' : 'Guardó Avance', detalles: `Reporte #${numeroReporte}` }]);
      if (!finalizar) showToast('Avance guardado y horas registradas.');
      return true;
    } catch (e: any) {
      showToast(`Error BD: ${e.message}`, 'error');
      return false;
    } finally { setLoading(false); }
  };

  const handleGenerarPDF = async () => {
    if (!esModoLectura) {
      const exito = await guardarEnBaseDeDatos(true);
      if (!exito) return; 
    }
    setLoading(true);
    await generarDocumentoPDF({
      fechas: fechasSemana, numeroReporte, esModoLectura, periodoGuardado, perfilDetectado, actividades, cierre,
      onSuccess: () => showToast('📕 Documento PDF descargado exitosamente'),
      onError: () => showToast('Error al generar PDF.', 'error'),
      onFinish: onBack
    });
    setLoading(false);
  };

  const renderToast = () => {
    if (!toast) return null;
    return (
      <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center gap-3 ${toast.isExiting ? 'animate-fade-out' : 'animate-fade-in'} ${toast.type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' : 'bg-slate-800 text-white'}`}>
        <span className="text-2xl">{toast.type === 'error' ? '⚠️' : '✅'}</span>{toast.message}
      </div>
    );
  };

  if (loading) return <div className="flex h-full items-center justify-center p-8"><div className="text-xl text-gray-500 font-bold animate-pulse">Cargando tu información...</div></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow mt-2 border-t-4 border-green-500 mb-10 relative">
      {renderToast()}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-blue-500 font-bold flex gap-1 items-center transition">⬅ Volver al Tablero</button>
        <div className="text-right text-sm bg-gray-50 p-2 rounded-lg border"><p><strong>Becario:</strong> {perfilDetectado?.nombre_completo}</p><p><strong>Reporte:</strong> {numeroReporte}</p></div>
      </div>

      {esModoLectura && <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4 text-center font-bold">👁️ MODO LECTURA: Reporte histórico.</div>}
      
      <h3 className="font-bold text-gray-700 mb-3 text-lg border-b pb-2">📅 Actividades Diarias y Registro de Horas</h3>
      
      <div className="grid gap-6 mb-8">
        {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => {
          const valEntrada = horas[`entrada_${dia}`]; 
          const valSalida = horas[`salida_${dia}`]; 

          return (
            <div key={dia} className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden transition duration-300">
              <div className="bg-slate-50 flex flex-col md:flex-row justify-between items-center p-4 border-b">
                <span className="w-32 capitalize font-bold text-slate-700 text-lg flex items-center mb-3 md:mb-0">
                  <span className="bg-white border p-2 rounded-lg mr-2 text-xl shadow-sm">📅</span>{dia}
                </span>
                
                <div className="flex gap-4 w-full md:w-auto">
                  {/* ENTRADA: SOLO LECTURA SIEMPRE */}
                  <div className="flex-1 md:w-36">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Entrada</label>
                    <div className="relative flex items-center justify-center py-2 px-3 rounded-lg border bg-gray-100 border-gray-200 cursor-not-allowed">
                      {valEntrada ? (
                        <span className="font-bold text-blue-700 flex gap-2 items-center text-sm">
                          <span className="text-lg">🕒</span> {formatTimeAMPM(valEntrada)}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold flex gap-2 items-center text-xs">
                          <span className="text-lg opacity-70">🔒</span> Automático
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SALIDA: EDITABLE */}
                  <div className="flex-1 md:w-36">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Salida</label>
                    <div className={`relative flex items-center justify-center py-2 px-3 rounded-lg border transition-all ${esModoLectura ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-blue-200 hover:border-blue-400 shadow-sm cursor-pointer'}`}>
                      {valSalida ? <span className="font-bold text-blue-700 flex gap-2 items-center text-sm">🕒 {formatTimeAMPM(valSalida)}</span> : <span className="text-gray-400 font-bold text-sm">🕒 Seleccionar</span>}
                      <input 
                        type="time" 
                        value={valSalida} 
                        onChange={(e) => !esModoLectura && setHoras({ ...horas, [`salida_${dia}`]: e.target.value })} 
                        disabled={esModoLectura} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white">
                <textarea 
                  placeholder={esModoLectura ? '' : 'Describe tus actividades...'} 
                  className={`w-full border-none p-2 h-24 resize-none outline-none ${esModoLectura ? 'text-gray-600 bg-transparent cursor-not-allowed' : 'text-gray-800'}`}
                  value={actividades[dia as keyof typeof actividades]} 
                  onChange={(e) => !esModoLectura && setActividades({ ...actividades, [dia]: e.target.value })} 
                  disabled={esModoLectura} 
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 border-t pt-6">
        {!esModoLectura && (
          <button onClick={() => guardarEnBaseDeDatos(false)} disabled={loading} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 shadow-md">
            {loading ? 'Guardando...' : '💾 Guardar Avance del Día'}
          </button>
        )}
        <button onClick={handleGenerarPDF} disabled={loading} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 shadow-md transform hover:-translate-y-1 transition">
          {esModoLectura ? '📕 Descargar Copia PDF' : '📕 Finalizar y Descargar PDF'}
        </button>
      </div>
    </div>
  );
}
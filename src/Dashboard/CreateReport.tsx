import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const obtenerFechasSemana = () => {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diferenciaLunes);
  const fechas: any = {};
  const opciones: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

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

const fetchImageAsBase64 = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo descargar la imagen');
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

// 🟢 FILTRO MÁGICO PARA LA BASE DE DATOS: Convierte textos vacíos en "null"
const formatForDB = (val: string) => (val && val.trim() !== '' ? val : null);

type ViewState = 'checking' | 'first_report' | 'weekly_report';

interface CreateReportProps {
  onBack: () => void;
  userEmail: string;
  reporteIdParaVer?: number | null;
}

export default function CreateReport({
  onBack,
  userEmail,
  reporteIdParaVer,
}: CreateReportProps) {
  const [view, setView] = useState<ViewState>(
    reporteIdParaVer ? 'weekly_report' : 'checking'
  );
  const esModoLectura = !!reporteIdParaVer;

  const [nombre, setNombre] = useState('');
  const [area, setArea] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [entradaFija, setEntradaFija] = useState('');
  const [salidaFija, setSalidaFija] = useState('');

  const [loading, setLoading] = useState(false);
  const [reporteId, setReporteId] = useState<number | null>(null);
  const [numeroReporte, setNumeroReporte] = useState(1);
  const [perfilDetectado, setPerfilDetectado] = useState<any>(null);
  const [periodoGuardado, setPeriodoGuardado] = useState('');

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isExiting: boolean;
  } | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setToast({ message, type, isExiting: false });
    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, isExiting: true } : null));
      setTimeout(() => setToast(null), 400);
    }, 3500);
  };

  const [actividades, setActividades] = useState({
    lunes: '',
    martes: '',
    miercoles: '',
    jueves: '',
    viernes: '',
  });

  const [horas, setHoras] = useState<any>({
    entrada_lunes: '',
    salida_lunes: '',
    entrada_martes: '',
    salida_martes: '',
    entrada_miercoles: '',
    salida_miercoles: '',
    entrada_jueves: '',
    salida_jueves: '',
    entrada_viernes: '',
    salida_viernes: '',
  });

  const [bloqueados, setBloqueados] = useState({
    lunes: false,
    martes: false,
    miercoles: false,
    jueves: false,
    viernes: false,
  });
  const [cierre, setCierre] = useState({
    aprendizajes: '',
    dificultades: '',
    plan_siguiente: '',
  });

  useEffect(() => {
    if (view === 'checking') {
      verificarPerfilExistente();
    } else if (view === 'weekly_report') {
      cargarDatosReporte();
    }
  }, [view]);

  const verificarPerfilExistente = async () => {
    try {
      const { data } = await supabase
        .from('perfiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      if (data) {
        setPerfilDetectado(data);
        setView('weekly_report');
      } else {
        setView('first_report');
      }
    } catch (error) {
      console.error(error);
      setView('first_report');
    }
  };

  const cargarDatosReporte = async () => {
    setLoading(true);
    try {
      if (!perfilDetectado) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        if (perfil) setPerfilDetectado(perfil);
      }

      let reporteData;

      if (esModoLectura && reporteIdParaVer) {
        const { data } = await supabase
          .from('reportes')
          .select('*')
          .eq('id', reporteIdParaVer)
          .maybeSingle();
        reporteData = data;
      } else {
        const { data } = await supabase
          .from('reportes')
          .select('*')
          .eq('email', userEmail)
          .eq('estado', 'borrador')
          .maybeSingle();
        reporteData = data;
      }

      if (reporteData) {
        setReporteId(reporteData.id);
        setNumeroReporte(reporteData.numero_reporte);
        setPeriodoGuardado(reporteData.periodo_semana);

        const act = {
          lunes: reporteData.actividad_lunes || '',
          martes: reporteData.actividad_martes || '',
          miercoles: reporteData.actividad_miercoles || '',
          jueves: reporteData.actividad_jueves || '',
          viernes: reporteData.actividad_viernes || '',
        };
        setActividades(act);

        setBloqueados({
          lunes: esModoLectura ? true : !!act.lunes,
          martes: esModoLectura ? true : !!act.martes,
          miercoles: esModoLectura ? true : !!act.miercoles,
          jueves: esModoLectura ? true : !!act.jueves,
          viernes: esModoLectura ? true : !!act.viernes,
        });

        setCierre({
          aprendizajes: reporteData.aprendizajes || '',
          dificultades: reporteData.dificultades || '',
          plan_siguiente: reporteData.plan_siguiente_semana || '',
        });

        const { data: horasData } = await supabase
          .from('hrs_entrada_y_hrs_salida')
          .select('*')
          .eq('reporte_id', reporteData.id)
          .maybeSingle();
        if (horasData) {
          setHoras({
            entrada_lunes: formatTimeForInput(horasData.entrada_lunes),
            salida_lunes: formatTimeForInput(horasData.salida_lunes),
            entrada_martes: formatTimeForInput(horasData.entrada_martes),
            salida_martes: formatTimeForInput(horasData.salida_martes),
            entrada_miercoles: formatTimeForInput(horasData.entrada_miercoles),
            salida_miercoles: formatTimeForInput(horasData.salida_miercoles),
            entrada_jueves: formatTimeForInput(horasData.entrada_jueves),
            salida_jueves: formatTimeForInput(horasData.salida_jueves),
            entrada_viernes: formatTimeForInput(horasData.entrada_viernes),
            salida_viernes: formatTimeForInput(horasData.salida_viernes),
          });
        }
      } else {
        const { count } = await supabase
          .from('reportes')
          .select('*', { count: 'exact', head: true })
          .eq('email', userEmail)
          .eq('estado', 'completado');
        setNumeroReporte((count || 0) + 1);
        setReporteId(null);
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!nombre || !area || !supervisor || !entradaFija || !salidaFija)
      return showToast(
        'Por favor llena todos los campos, incluyendo tus horarios.',
        'error'
      );
    setLoading(true);
    try {
      const { error } = await supabase.from('perfiles').insert([
        {
          email: userEmail,
          nombre_completo: nombre,
          area_departamento: area,
          nombre_supervisor: supervisor,
          hora_entrada_establecida: entradaFija,
          hora_salida_establecida: salidaFija,
        },
      ]);
      if (error) throw error;

      await supabase
        .from('logs_sistema')
        .insert([
          {
            usuario_email: userEmail,
            accion: 'Creó Perfil',
            detalles: 'Configuración inicial',
          },
        ]);
      showToast('Perfil guardado con éxito. Comenzando bitácora...');

      setPerfilDetectado({
        nombre_completo: nombre,
        area_departamento: area,
        nombre_supervisor: supervisor,
        hora_entrada_establecida: entradaFija,
        hora_salida_establecida: salidaFija,
      });
      setView('weekly_report');
    } catch (e: any) {
      showToast('Error al guardar perfil', 'error');
      await supabase
        .from('logs_sistema')
        .insert([
          {
            usuario_email: userEmail,
            accion: 'Error al Crear Perfil',
            detalles: e.message,
          },
        ]);
    } finally {
      setLoading(false);
    }
  };

  const calcularHoras = (entrada: string, salida: string) => {
    if (!entrada || !salida) return 0;
    const [hE, mE] = entrada.split(':').map(Number);
    const [hS, mS] = salida.split(':').map(Number);
    let diff = hS + mS / 60 - (hE + mE / 60);
    return diff > 0 ? diff : 0;
  };

  const guardarEnBaseDeDatos = async (finalizar = false) => {
    if (esModoLectura) return true;

    setLoading(true);
    try {
      const fechas = obtenerFechasSemana();
      const periodo = `Del ${fechas.inicio} al ${fechas.fin}`;

      const datosReporte = {
        email: userEmail,
        numero_reporte: numeroReporte,
        periodo_semana: periodo,
        estado: finalizar ? 'completado' : 'borrador',
        actividad_lunes: actividades.lunes,
        actividad_martes: actividades.martes,
        actividad_miercoles: actividades.miercoles,
        actividad_jueves: actividades.jueves,
        actividad_viernes: actividades.viernes,
        aprendizajes: cierre.aprendizajes,
        dificultades: cierre.dificultades,
        plan_siguiente_semana: cierre.plan_siguiente,
      };

      let currentReporteId = reporteId;

      if (reporteId) {
        const { error } = await supabase
          .from('reportes')
          .update(datosReporte)
          .eq('id', reporteId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('reportes')
          .insert([datosReporte])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setReporteId(data.id);
          currentReporteId = data.id;
        }
      }

      if (currentReporteId) {
        const totalSemana =
          calcularHoras(horas.entrada_lunes, horas.salida_lunes) +
          calcularHoras(horas.entrada_martes, horas.salida_martes) +
          calcularHoras(horas.entrada_miercoles, horas.salida_miercoles) +
          calcularHoras(horas.entrada_jueves, horas.salida_jueves) +
          calcularHoras(horas.entrada_viernes, horas.salida_viernes);

        // 🟢 AQUÍ ESTÁ LA SOLUCIÓN AL ERROR DE BASE DE DATOS: Usamos formatForDB
        const datosHoras = {
          reporte_id: currentReporteId,
          usuario_email: userEmail,
          entrada_lunes: formatForDB(horas.entrada_lunes),
          salida_lunes: formatForDB(horas.salida_lunes),
          entrada_martes: formatForDB(horas.entrada_martes),
          salida_martes: formatForDB(horas.salida_martes),
          entrada_miercoles: formatForDB(horas.entrada_miercoles),
          salida_miercoles: formatForDB(horas.salida_miercoles),
          entrada_jueves: formatForDB(horas.entrada_jueves),
          salida_jueves: formatForDB(horas.salida_jueves),
          entrada_viernes: formatForDB(horas.entrada_viernes),
          salida_viernes: formatForDB(horas.salida_viernes),
          total_semana: parseFloat(totalSemana.toFixed(2)),
        };

        const { data: existHoras } = await supabase
          .from('hrs_entrada_y_hrs_salida')
          .select('id')
          .eq('reporte_id', currentReporteId)
          .maybeSingle();

        if (existHoras) {
          const { error } = await supabase
            .from('hrs_entrada_y_hrs_salida')
            .update(datosHoras)
            .eq('id', existHoras.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('hrs_entrada_y_hrs_salida')
            .insert([datosHoras]);
          if (error) throw error;
        }
      }

      const accion = finalizar ? 'Finalizó Reporte' : 'Guardó Avance';
      await supabase
        .from('logs_sistema')
        .insert([
          {
            usuario_email: userEmail,
            accion: accion,
            detalles: `Reporte #${numeroReporte}`,
          },
        ]);

      setBloqueados({
        lunes: !!actividades.lunes,
        martes: !!actividades.martes,
        miercoles: !!actividades.miercoles,
        jueves: !!actividades.jueves,
        viernes: !!actividades.viernes,
      });

      if (!finalizar) showToast('Avance guardado y horas registradas.');

      return true;
    } catch (e: any) {
      // 🟢 GUARDAR ERROR EN LA BASE DE DATOS PARA VERLO EN NOTIFICACIONES
      showToast('Error de Base de Datos. Revisa Notificaciones.', 'error');
      await supabase
        .from('logs_sistema')
        .insert([
          {
            usuario_email: userEmail,
            accion: 'Error al Guardar',
            detalles: e.message,
          },
        ]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const generarDocumentoWord = async () => {
    if (!esModoLectura) {
      const exito = await guardarEnBaseDeDatos(true);
      if (!exito) return;
    }
    setLoading(true);
    try {
      const fechas = obtenerFechasSemana();
      const urlPlantilla =
        'https://bddsykxhwfgumianzxqp.supabase.co/storage/v1/object/public/plantillas/plantilla_reporte_v3.docx';
      const response = await fetch(urlPlantilla);
      if (!response.ok) throw new Error('No se pudo descargar la plantilla.');
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      let doc;
      try {
        doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      } catch (error: any) {
        throw new Error(
          'El archivo Word tiene un error de sintaxis en sus llaves.'
        );
      }

      const numeroSeguro = numeroReporte || 1;
      const versionFormateada = numeroSeguro.toString().padStart(2, '0');

      try {
        doc.render({
          nombre_aprendiz: perfilDetectado?.nombre_completo || 'Becario',
          area: perfilDetectado?.area_departamento || 'TI',
          supervisor: perfilDetectado?.nombre_supervisor || 'Supervisor',
          periodo: esModoLectura
            ? periodoGuardado || `Del ${fechas.inicio} al ${fechas.fin}`
            : `Del ${fechas.inicio} al ${fechas.fin}`,
          version: versionFormateada,
          fecha_lunes: fechas.fecha_lunes,
          fecha_martes: fechas.fecha_martes,
          fecha_miercoles: fechas.fecha_miercoles,
          fecha_jueves: fechas.fecha_jueves,
          fecha_viernes: fechas.fecha_viernes,
          act_lunes: actividades.lunes || '',
          act_martes: actividades.martes || '',
          act_miercoles: actividades.miercoles || '',
          act_jueves: actividades.jueves || '',
          act_viernes: actividades.viernes || '',
          aprendizajes: cierre.aprendizajes || '',
          dificultades: cierre.dificultades || '',
          plan_siguiente: cierre.plan_siguiente || '',
        });
      } catch (error: any) {
        throw new Error('Error al rellenar los campos del Word.');
      }

      const out = doc
        .getZip()
        .generate({
          type: 'blob',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      saveAs(
        out,
        `Reporte_Semana_${versionFormateada}_${
          perfilDetectado?.nombre_completo || 'Becario'
        }.docx`
      );
      showToast('📄 Documento Word descargado exitosamente');
      if (!esModoLectura) onBack();
    } catch (error: any) {
      showToast('Error al generar Word.', 'error');
      await supabase
        .from('logs_sistema')
        .insert([
          {
            usuario_email: userEmail,
            accion: 'Error Generando Word',
            detalles: error.message,
          },
        ]);
    } finally {
      setLoading(false);
    }
  };

  const generarDocumentoPDF = async () => {
    if (!esModoLectura) {
      const exito = await guardarEnBaseDeDatos(true);
      if (!exito) return;
    }
    setLoading(true);
    try {
      const fechas = obtenerFechasSemana();
      const doc = new jsPDF();
      const numeroSeguro = numeroReporte || 1;
      const versionFormateada = numeroSeguro.toString().padStart(2, '0');
      const periodoFinal = esModoLectura
        ? periodoGuardado
        : `Del ${fechas.inicio} al ${fechas.fin}`;

      const urlFondo =
        'https://bddsykxhwfgumianzxqp.supabase.co/storage/v1/object/public/plantillas/fondo_reporte.png';
      try {
        const base64Img = await fetchImageAsBase64(urlFondo);
        doc.addImage(base64Img, 'PNG', 0, 0, 210, 297);
      } catch (err) {
        console.warn('Fondo no cargado.');
      }

      doc.setFont('helvetica');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(versionFormateada, 178, 22);
      let currentY = 42;

      const addRow = (label: string, value: string, yOffset: number) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 15, currentY + yOffset);
        const labelWidth = doc.getTextWidth(label) + 1;
        doc.setFont(undefined, 'normal');
        doc.text(value, 15 + labelWidth, currentY + yOffset);
      };

      addRow(
        'Nombre completo del aprendiz: ',
        perfilDetectado?.nombre_completo || 'Pendiente',
        0
      );
      addRow(
        'Área/Dpto.: ',
        perfilDetectado?.area_departamento || 'Pendiente',
        7
      );
      addRow(
        'Nombre completo del supervisor: ',
        perfilDetectado?.nombre_supervisor || 'Pendiente',
        14
      );
      addRow('Periodo del reporte: ', periodoFinal, 21);

      doc.setFont(undefined, 'bold');
      doc.text('Actividades: ', 15, currentY + 28);
      doc.setFont(undefined, 'normal');
      doc.text(
        'Describe de manera breve las actividades diarias realizadas.',
        15 + doc.getTextWidth('Actividades: ') + 1,
        currentY + 28
      );

      autoTable(doc, {
        startY: currentY + 34,
        margin: { left: 15, right: 15 },
        head: [['Fecha\nDD/MM/AA', 'Actividades realizadas']],
        body: [
          [`Lunes\n\n${fechas.fecha_lunes}`, actividades.lunes || ''],
          [`Martes\n\n${fechas.fecha_martes}`, actividades.martes || ''],
          [
            `Miércoles\n\n${fechas.fecha_miercoles}`,
            actividades.miercoles || '',
          ],
          [`Jueves\n\n${fechas.fecha_jueves}`, actividades.jueves || ''],
          [`Viernes\n\n${fechas.fecha_viernes}`, actividades.viernes || ''],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          halign: 'center',
          valign: 'middle',
          fontStyle: 'bold',
        },
        bodyStyles: {
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          textColor: [0, 0, 0],
          valign: 'top',
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },
          1: { cellWidth: 'auto' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont(undefined, 'bold');
      doc.text('Aprendizajes de la semana: ', 15, currentY);
      doc.setFont(undefined, 'normal');
      if (cierre.aprendizajes) {
        doc.text(cierre.aprendizajes, 15, currentY + 5, { maxWidth: 180 });
        currentY += 15;
      } else {
        currentY += 10;
      }

      doc.setFont(undefined, 'bold');
      doc.text('Retos o dificultades encontradas: ', 15, currentY);
      doc.setFont(undefined, 'normal');
      if (cierre.dificultades) {
        doc.text(cierre.dificultades, 15, currentY + 5, { maxWidth: 180 });
        currentY += 15;
      } else {
        currentY += 10;
      }

      doc.setFont(undefined, 'bold');
      doc.text('Plan de actividades para la siguiente semana: ', 15, currentY);
      doc.setFont(undefined, 'normal');
      if (cierre.plan_siguiente) {
        doc.text(cierre.plan_siguiente, 15, currentY + 5, { maxWidth: 180 });
        currentY += 15;
      } else {
        currentY += 10;
      }

      currentY += 5;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('Nota. ', 15, currentY);
      doc.setFont(undefined, 'normal');
      doc.text(
        'El becario o jefe inmediato adjuntan evidencias fotográficas semanales de las actividades realizadas.\nSe debe solicitar liga de drive al área de Recursos Humanos.',
        15 + doc.getTextWidth('Nota. '),
        currentY
      );

      currentY += 20;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(
        'Nombre y firma del aprendiz: __________________________________________________',
        15,
        currentY
      );
      doc.text(
        'Nombre y firma del supervisor: _________________________________________________',
        15,
        currentY + 15
      );

      doc.save(
        `Reporte_Semana_${versionFormateada}_${
          perfilDetectado?.nombre_completo || 'Becario'
        }.pdf`
      );
      showToast('📕 Documento PDF descargado exitosamente');
      if (!esModoLectura) onBack();
    } catch (error: any) {
      showToast('Error al generar PDF.', 'error');
      await supabase
        .from('logs_sistema')
        .insert([
          {
            usuario_email: userEmail,
            accion: 'Error Generando PDF',
            detalles: error.message,
          },
        ]);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'checking')
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-xl text-gray-500 font-bold animate-pulse">
          Cargando tu información...
        </div>
      </div>
    );

  const renderToast = () => {
    if (!toast) return null;
    return (
      <>
        <style>{`
          @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
          .toast-enter { animation: slideInRight 0.4s ease-out forwards; }
          .toast-exit { animation: slideOutRight 0.4s ease-in forwards; }
        `}</style>
        <div
          className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center gap-3 ${
            toast.isExiting ? 'toast-exit' : 'toast-enter'
          } ${
            toast.type === 'error'
              ? 'bg-red-100 text-red-800 border-l-4 border-red-500'
              : 'bg-slate-800 text-white'
          }`}
        >
          <span className="text-2xl">
            {toast.type === 'error' ? '⚠️' : '✅'}
          </span>
          {toast.message}
        </div>
      </>
    );
  };

  if (view === 'first_report') {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white rounded-xl shadow mt-8 border-t-4 border-blue-600 animate-fade-in relative">
        {renderToast()}
        <h2 className="font-bold text-2xl mb-2 text-gray-800">
          ¡Bienvenido a Alamex! 👋
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Configura tus datos iniciales y horario para comenzar. (Solo lo harás
          una vez).
        </p>

        <label className="block text-gray-700 font-bold mb-1 text-sm">
          Nombre Completo
        </label>
        <input
          className="w-full border p-3 rounded mb-4 focus:ring-2 outline-none"
          placeholder="Ej: Juan Pérez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <label className="block text-gray-700 font-bold mb-1 text-sm">
          Área o Departamento
        </label>
        <input
          className="w-full border p-3 rounded mb-4 focus:ring-2 outline-none"
          placeholder="Ej: TI"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
        <label className="block text-gray-700 font-bold mb-1 text-sm">
          Nombre del Supervisor
        </label>
        <input
          className="w-full border p-3 rounded mb-6 focus:ring-2 outline-none"
          placeholder="Ej: Ing. Carlos"
          value={supervisor}
          onChange={(e) => setSupervisor(e.target.value)}
        />

        <div className="bg-blue-50 p-4 rounded-xl mb-8 border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-3 text-sm">
            TU HORARIO DE SERVICIO ESTABLECIDO
          </h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                Hora de Entrada
              </label>
              <div className="relative flex items-center justify-center py-3 px-3 rounded-lg border bg-white border-blue-200 hover:border-blue-400 cursor-pointer">
                {entradaFija ? (
                  <span className="font-bold text-blue-700 flex gap-2 items-center text-sm">
                    <span className="text-lg">🕒</span>{' '}
                    {formatTimeAMPM(entradaFija)}
                  </span>
                ) : (
                  <span className="text-gray-400 font-bold flex gap-2 items-center text-sm">
                    <span className="text-lg opacity-70">🕒</span> Seleccionar
                  </span>
                )}
                <input
                  type="time"
                  value={entradaFija}
                  onChange={(e) => setEntradaFija(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                Hora de Salida
              </label>
              <div className="relative flex items-center justify-center py-3 px-3 rounded-lg border bg-white border-blue-200 hover:border-blue-400 cursor-pointer">
                {salidaFija ? (
                  <span className="font-bold text-blue-700 flex gap-2 items-center text-sm">
                    <span className="text-lg">🕒</span>{' '}
                    {formatTimeAMPM(salidaFija)}
                  </span>
                ) : (
                  <span className="text-gray-400 font-bold flex gap-2 items-center text-sm">
                    <span className="text-lg opacity-70">🕒</span> Seleccionar
                  </span>
                )}
                <input
                  type="time"
                  value={salidaFija}
                  onChange={(e) => setSalidaFija(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold shadow-lg transition"
        >
          Guardar y Comenzar Bitácora
        </button>
      </div>
    );
  }

  if (view === 'weekly_report') {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow mt-2 border-t-4 border-green-500 animate-fade-in mb-10 relative">
        {renderToast()}

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-blue-500 font-bold flex gap-1 items-center transition"
          >
            ⬅ Volver al Tablero
          </button>
          <div className="text-right text-sm bg-gray-50 p-2 rounded-lg border">
            <p>
              <strong>Becario:</strong> {perfilDetectado?.nombre_completo}
            </p>
            <p>
              <strong>Reporte:</strong> {numeroReporte}
            </p>
          </div>
        </div>

        {esModoLectura && (
          <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4 text-center font-bold">
            👁️ MODO LECTURA: Estás viendo un reporte pasado. No se puede editar.
          </div>
        )}
        {!esModoLectura && (
          <div className="bg-yellow-50 p-3 rounded mb-4 text-xs text-yellow-800 border border-yellow-200">
            ⚠️ Nota: Una vez que guardes el avance de un día,{' '}
            <strong>ya no podrás editarlo ni cambiar las horas</strong>.
          </div>
        )}

        <h3 className="font-bold text-gray-700 mb-3 text-lg border-b pb-2">
          📅 Actividades Diarias y Registro de Horas
        </h3>

        <div className="grid gap-6 mb-8">
          {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => {
            // @ts-ignore
            const valEntrada = horas[`entrada_${dia}`];
            // @ts-ignore
            const valSalida = horas[`salida_${dia}`];
            const isEntradaLlenada = !!valEntrada;
            // @ts-ignore
            const diaBloqueado = bloqueados[dia];

            return (
              <div
                key={dia}
                className={`bg-white border rounded-xl shadow-sm overflow-hidden transition duration-300 ${
                  !isEntradaLlenada && !esModoLectura
                    ? 'border-gray-200'
                    : 'border-blue-200 ring-1 ring-blue-50'
                }`}
              >
                <div className="bg-slate-50 flex flex-col md:flex-row justify-between items-center p-4 border-b">
                  <span className="w-32 capitalize font-bold text-slate-700 text-lg flex items-center mb-3 md:mb-0">
                    <span className="bg-white border p-2 rounded-lg mr-2 text-xl shadow-sm">
                      📅
                    </span>
                    {dia}
                  </span>

                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-36">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                        Entrada
                      </label>
                      <div
                        className={`relative flex items-center justify-center py-2 px-3 rounded-lg border transition-all duration-200 ${
                          esModoLectura || diaBloqueado
                            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                            : 'bg-white border-blue-200 hover:border-blue-400 shadow-sm cursor-pointer'
                        }`}
                      >
                        {valEntrada ? (
                          <span className="font-bold text-blue-700 flex gap-2 items-center text-sm">
                            <span className="text-lg">🕒</span>{' '}
                            {formatTimeAMPM(valEntrada)}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold flex gap-2 items-center text-sm">
                            <span className="text-lg opacity-70">🕒</span>{' '}
                            Seleccionar
                          </span>
                        )}
                        <input
                          type="time"
                          value={valEntrada}
                          // @ts-ignore
                          onChange={(e) =>
                            !esModoLectura &&
                            !diaBloqueado &&
                            setHoras({
                              ...horas,
                              [`entrada_${dia}`]: e.target.value,
                            })
                          }
                          disabled={esModoLectura || diaBloqueado}
                          className={`absolute inset-0 w-full h-full opacity-0 ${
                            esModoLectura || diaBloqueado
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          } [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
                        />
                      </div>
                    </div>

                    <div className="flex-1 md:w-36">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                        Salida
                      </label>
                      <div
                        className={`relative flex items-center justify-center py-2 px-3 rounded-lg border transition-all duration-200 ${
                          esModoLectura || diaBloqueado || !isEntradaLlenada
                            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                            : 'bg-white border-blue-200 hover:border-blue-400 shadow-sm cursor-pointer'
                        }`}
                      >
                        {valSalida ? (
                          <span className="font-bold text-blue-700 flex gap-2 items-center text-sm">
                            <span className="text-lg">🕒</span>{' '}
                            {formatTimeAMPM(valSalida)}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold flex gap-2 items-center text-sm">
                            <span className="text-lg opacity-70">🕒</span>{' '}
                            Seleccionar
                          </span>
                        )}
                        <input
                          type="time"
                          value={valSalida}
                          // @ts-ignore
                          onChange={(e) =>
                            !esModoLectura &&
                            !diaBloqueado &&
                            isEntradaLlenada &&
                            setHoras({
                              ...horas,
                              [`salida_${dia}`]: e.target.value,
                            })
                          }
                          disabled={
                            esModoLectura || diaBloqueado || !isEntradaLlenada
                          }
                          className={`absolute inset-0 w-full h-full opacity-0 ${
                            esModoLectura || diaBloqueado || !isEntradaLlenada
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          } [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white">
                  <textarea
                    placeholder={
                      esModoLectura
                        ? ''
                        : isEntradaLlenada
                        ? 'Describe las actividades que realizaste el día de hoy...'
                        : '🔒 Primero coloca tu hora de ENTRADA para desbloquear tus actividades y hora de salida.'
                    }
                    className={`w-full border-none p-2 h-24 resize-none transition outline-none ${
                      esModoLectura || diaBloqueado
                        ? 'text-gray-600 bg-transparent'
                        : !isEntradaLlenada
                        ? 'text-transparent bg-transparent cursor-not-allowed select-none'
                        : 'text-gray-800 bg-white'
                    }`}
                    // @ts-ignore
                    value={actividades[dia]}
                    // @ts-ignore
                    onChange={(e) =>
                      !esModoLectura &&
                      !diaBloqueado &&
                      isEntradaLlenada &&
                      setActividades({ ...actividades, [dia]: e.target.value })
                    }
                    disabled={
                      esModoLectura || diaBloqueado || !isEntradaLlenada
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="font-bold text-gray-700 block mb-1 text-sm">
              ¿Qué aprendiste en la semana?
            </label>
            <textarea
              className={`w-full border p-3 rounded-lg h-24 resize-none transition outline-none focus:border-blue-400 ${
                esModoLectura ? 'bg-gray-100 text-gray-500' : 'bg-white'
              }`}
              value={cierre.aprendizajes}
              onChange={(e) =>
                !esModoLectura &&
                setCierre({ ...cierre, aprendizajes: e.target.value })
              }
              disabled={esModoLectura}
            />
          </div>
          <div>
            <label className="font-bold text-gray-700 block mb-1 text-sm">
              ¿Qué se complicó en la semana?
            </label>
            <textarea
              className={`w-full border p-3 rounded-lg h-24 resize-none transition outline-none focus:border-blue-400 ${
                esModoLectura ? 'bg-gray-100 text-gray-500' : 'bg-white'
              }`}
              value={cierre.dificultades}
              onChange={(e) =>
                !esModoLectura &&
                setCierre({ ...cierre, dificultades: e.target.value })
              }
              disabled={esModoLectura}
            />
          </div>
        </div>

        <label className="font-bold text-gray-700 block mb-1 text-sm">
          PLAN SIGUIENTE SEMANA
        </label>
        <input
          className={`w-full border p-3 rounded-lg mb-6 transition outline-none focus:border-blue-400 ${
            esModoLectura ? 'bg-gray-100 text-gray-500' : 'bg-white'
          }`}
          value={cierre.plan_siguiente}
          onChange={(e) =>
            !esModoLectura &&
            setCierre({ ...cierre, plan_siguiente: e.target.value })
          }
          disabled={esModoLectura}
        />

        <div className="flex flex-col gap-4 border-t pt-6">
          {!esModoLectura && (
            <button
              onClick={() => guardarEnBaseDeDatos(false)}
              disabled={loading}
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 transition shadow-md"
            >
              {loading
                ? 'Guardando horas y avances...'
                : '💾 Guardar Avance del Día'}
            </button>
          )}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={generarDocumentoWord}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-md transition transform hover:-translate-y-1"
            >
              {esModoLectura
                ? '📄 Descargar Copia Word'
                : '📄 Finalizar y Descargar Word'}
            </button>
            <button
              onClick={generarDocumentoPDF}
              disabled={loading}
              className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 shadow-md transition transform hover:-translate-y-1"
            >
              {esModoLectura
                ? '📕 Descargar Copia PDF'
                : '📕 Finalizar y Descargar PDF'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

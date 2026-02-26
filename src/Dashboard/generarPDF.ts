import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Esta función se queda aquí porque solo la usa el PDF
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

interface GenerarPDFParams {
  fechas: any;
  numeroReporte: number;
  esModoLectura: boolean;
  periodoGuardado: string;
  perfilDetectado: any;
  actividades: any;
  cierre: any;
  onSuccess: () => void;
  onError: (error: string) => void;
  onFinish: () => void; // Para ejecutar el onBack si no es modo lectura
}

export const generarDocumentoPDF = async ({
  fechas,
  numeroReporte,
  esModoLectura,
  periodoGuardado,
  perfilDetectado,
  actividades,
  cierre,
  onSuccess,
  onError,
  onFinish
}: GenerarPDFParams) => {
  
  try {
    const doc = new jsPDF();
    const numeroSeguro = numeroReporte || 1;
    const versionFormateada = numeroSeguro.toString().padStart(2, '0');
    const periodoFinal = esModoLectura ? periodoGuardado : `Del ${fechas.inicio} al ${fechas.fin}`;

    const urlFondo = 'https://bddsykxhwfgumianzxqp.supabase.co/storage/v1/object/public/plantillas/fondo_reporte.png';
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

    addRow('Nombre completo del aprendiz: ', perfilDetectado?.nombre_completo || 'Pendiente', 0);
    addRow('Área/Dpto.: ', perfilDetectado?.area_departamento || 'Pendiente', 7);
    addRow('Nombre completo del supervisor: ', perfilDetectado?.nombre_supervisor || 'Pendiente', 14);
    addRow('Periodo del reporte: ', periodoFinal, 21);

    doc.setFont(undefined, 'bold');
    doc.text('Actividades: ', 15, currentY + 28);
    doc.setFont(undefined, 'normal');
    doc.text('Describe de manera breve las actividades diarias realizadas.', 15 + doc.getTextWidth('Actividades: ') + 1, currentY + 28);

    autoTable(doc, {
      startY: currentY + 34,
      margin: { left: 15, right: 15 },
      head: [['Fecha\nDD/MM/AA', 'Actividades realizadas']],
      body: [
        [`Lunes\n\n${fechas.fecha_lunes}`, actividades.lunes || ''],
        [`Martes\n\n${fechas.fecha_martes}`, actividades.martes || ''],
        [`Miércoles\n\n${fechas.fecha_miercoles}`, actividades.miercoles || ''],
        [`Jueves\n\n${fechas.fecha_jueves}`, actividades.jueves || ''],
        [`Viernes\n\n${fechas.fecha_viernes}`, actividades.viernes || ''],
      ],
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, halign: 'center', valign: 'middle', fontStyle: 'bold' },
      bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.3, textColor: [0, 0, 0], valign: 'top' },
      columnStyles: { 0: { cellWidth: 35, halign: 'center' }, 1: { cellWidth: 'auto' } },
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
    doc.text('El becario o jefe inmediato adjuntan evidencias fotográficas semanales de las actividades realizadas.\nSe debe solicitar liga de drive al área de Recursos Humanos.', 15 + doc.getTextWidth('Nota. '), currentY);

    currentY += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Nombre y firma del aprendiz: __________________________________________________', 15, currentY);
    doc.text('Nombre y firma del supervisor: _________________________________________________', 15, currentY + 15);

    doc.save(`Reporte_Semana_${versionFormateada}_${perfilDetectado?.nombre_completo || 'Becario'}.pdf`);
    
    onSuccess();
    if (!esModoLectura) onFinish();

  } catch (error: any) {
    onError(error.message);
  }
};
import { supabase } from '../supabaseClient';

export const registrarEntradaActual = async (userEmail: string) => {
  const ahora = new Date();
  const horaEquipo = ahora.toLocaleTimeString('en-GB', { hour12: false }); // HH:mm:ss
  
  // Extraemos el día de la semana de la laptop
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const diaHoy = diasSemana[ahora.getDay()];

  if (diaHoy === 'domingo' || diaHoy === 'sabado') return;

  try {
    const { data: reporte } = await supabase
      .from('reportes')
      .select('id')
      .eq('email', userEmail)
      .eq('estado', 'pendiente')
      .maybeSingle();

    if (reporte) {
      const columnaEntrada = `entrada_${diaHoy}`;

      const { data: registro } = await supabase
        .from('hrs_entrada_y_hrs_salida')
        .select(columnaEntrada)
        .eq('reporte_id', reporte.id)
        .maybeSingle();

      // Regla de oro: Solo guarda si el dato es NULL (no existe registro previo)
      if (registro && registro[columnaEntrada] === null) {
        await supabase
          .from('hrs_entrada_y_hrs_salida')
          .update({ [columnaEntrada]: horaEquipo })
          .eq('reporte_id', reporte.id);
      }
    }
  } catch (error) {
    console.error('Error en persistencia de datos:', error);
  }
};
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ConfigurarPerfil() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || '';

  const [nombre, setNombre] = useState('');
  const [area, setArea] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [entradaFija, setEntradaFija] = useState('');
  const [salidaFija, setSalidaFija] = useState('');
  const [loading, setLoading] = useState(false);

  const formatTimeAMPM = (timeStr: string) => {
    if (!timeStr) return '';
    let [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const handleSaveProfile = async () => {
    if (!nombre || !area || !supervisor || !entradaFija || !salidaFija) {
      alert('Por favor llena todos los campos, incluyendo tus horarios.');
      return;
    }
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

      await supabase.from('logs_sistema').insert([{ usuario_email: userEmail, accion: 'Creó Perfil', detalles: 'Configuración inicial completada' }]);
      
      navigate('/dashboard');
    } catch (e: any) {
      alert('Error al guardar el perfil: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userEmail) return <div className="p-10 text-center text-red-500 font-bold">Inicia sesión primero.</div>;

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
      <div className="p-8 w-full max-w-xl bg-white rounded-xl shadow-xl border-t-4 border-blue-600 animate-fade-in relative">
        <h2 className="font-bold text-2xl mb-2 text-gray-800">¡Bienvenido a Alamex! 👋</h2>
        <p className="text-gray-500 mb-6 text-sm">Antes de continuar, configura tus datos iniciales y horario de servicio. (Solo lo harás una vez).</p>

        <label className="block text-gray-700 font-bold mb-1 text-sm">Nombre Completo</label>
        <input className="w-full border p-3 rounded mb-4 focus:ring-2 outline-none" placeholder="Ej: Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        
        <label className="block text-gray-700 font-bold mb-1 text-sm">Área o Departamento</label>
        <input className="w-full border p-3 rounded mb-4 focus:ring-2 outline-none" placeholder="Ej: TI" value={area} onChange={(e) => setArea(e.target.value)} />
        
        <label className="block text-gray-700 font-bold mb-1 text-sm">Nombre del Supervisor</label>
        <input className="w-full border p-3 rounded mb-6 focus:ring-2 outline-none" placeholder="Ej: Ing. Carlos" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} />

        <div className="bg-blue-50 p-4 rounded-xl mb-8 border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-3 text-sm">TU HORARIO DE SERVICIO ESTABLECIDO</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Hora de Entrada</label>
              <div className="relative flex items-center justify-center py-3 px-3 rounded-lg border bg-white border-blue-200 hover:border-blue-400 cursor-pointer">
                {entradaFija ? <span className="font-bold text-blue-700 flex gap-2 items-center text-sm"><span className="text-lg">🕒</span> {formatTimeAMPM(entradaFija)}</span> : <span className="text-gray-400 font-bold flex gap-2 items-center text-sm"><span className="text-lg opacity-70">🕒</span> Seleccionar</span>}
                <input type="time" value={entradaFija} onChange={(e) => setEntradaFija(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0" />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Hora de Salida</label>
              <div className="relative flex items-center justify-center py-3 px-3 rounded-lg border bg-white border-blue-200 hover:border-blue-400 cursor-pointer">
                {salidaFija ? <span className="font-bold text-blue-700 flex gap-2 items-center text-sm"><span className="text-lg">🕒</span> {formatTimeAMPM(salidaFija)}</span> : <span className="text-gray-400 font-bold flex gap-2 items-center text-sm"><span className="text-lg opacity-70">🕒</span> Seleccionar</span>}
                <input type="time" value={salidaFija} onChange={(e) => setSalidaFija(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0" />
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSaveProfile} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold shadow-lg transition">
          {loading ? 'Guardando...' : 'Guardar y Entrar al Sistema'}
        </button>
      </div>
    </div>
  );
}
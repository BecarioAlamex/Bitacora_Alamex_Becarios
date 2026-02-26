import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. CORRECCIÓN: Buscamos en tu TABLA PERSONALIZADA en lugar del Auth de Supabase
      // NOTA: Si tu tabla se llama distinto, cambia 'emails_and_passwords' por el nombre exacto
      const { data: user, error: userError } = await supabase
        .from('emails_and_passwords')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (userError || !user) {
        throw new Error('Credenciales incorrectas');
      }

      // Guardamos el email globalmente
      localStorage.setItem('userEmail', email);

      // 2. FUNCIÓN TIMESESSION: Capturamos la hora exacta de la computadora
      const fechaHoy = new Date().toLocaleDateString('es-MX');
      
      if (localStorage.getItem('sessionDate') !== fechaHoy) {
        localStorage.setItem('sessionDate', fechaHoy);
        localStorage.setItem('timeSession', new Date().toTimeString().substring(0, 5)); 
      }

      // 3. VERIFICAMOS SI ES USUARIO NUEVO
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!perfil) {
        navigate('/configurar-perfil');
      } else {
        navigate('/dashboard');
      }

    } catch (error: any) {
      setErrorMsg('Acceso denegado. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        
        <div className="flex justify-center mb-6">
          <img 
            src="/ALAMEX.jfif" 
            alt="Logo Alamex" 
            className="h-24 object-contain rounded-lg shadow-sm"
          />
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Iniciar Sesión</h2>
        
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center font-bold text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border p-3 rounded outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"
              placeholder="ejemplo@alam.mx"
              required 
            />
          </div>
          
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full border p-3 rounded outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition pr-12"
                placeholder="••••••••"
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-2xl hover:scale-110 transition-transform"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? '🐵' : '🙈'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition mt-2 shadow-md transform hover:-translate-y-1"
          >
            {loading ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
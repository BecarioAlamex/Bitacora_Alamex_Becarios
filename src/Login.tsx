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
      const { data: user, error: userError } = await supabase
        .from('emails_and_passwords')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (userError || !user) {
        throw new Error('Credenciales incorrectas');
      }

      localStorage.setItem('userEmail', email);

      // FUNCIÓN TIMESESSION: Capturamos la hora exacta de la computadora
      const fechaHoy = new Date().toLocaleDateString('es-MX');
      
      // Si es el primer login del día, guardamos la hora actual
      if (localStorage.getItem('sessionDate') !== fechaHoy) {
        localStorage.setItem('sessionDate', fechaHoy);
        // Guardamos en formato 24h para no romper las matemáticas, la bitácora lo mostrará en AM/PM
        localStorage.setItem('timeSession', new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })); 
      }

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
    <>
      {/* 🟢 ESTILOS PARA EL FONDO ANIMADO NEGRO-AZUL */}
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background: linear-gradient(-45deg, #000000, #0f172a, #1e3a8a, #000000);
          background-size: 400% 400%;
          animation: gradientBG 12s ease infinite;
        }
      `}</style>

      <div className="flex h-screen items-center justify-center animate-gradient p-4">
        {/* 🟢 TARJETA CON EFECTO DE CRISTAL (Glassmorphism) */}
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-blue-500 transform transition-all">
          
          <div className="flex justify-center mb-6">
            {/* 🟢 NUEVO LOGO ALAM.PNG */}
            <img 
              src="/Alam.png" 
              alt="Logo Alamex" 
              className="h-28 object-contain drop-shadow-md"
            />
          </div>

          <h2 className="text-2xl font-bold text-center text-slate-800 mb-6 tracking-wide">Iniciar Sesión</h2>
          
          {errorMsg && (
            <div className="bg-red-100/90 text-red-700 p-3 rounded-lg mb-4 text-center font-bold text-sm border border-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white transition-all shadow-inner"
                placeholder="ejemplo@alam.mx"
                required 
              />
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white transition-all shadow-inner pr-12"
                  placeholder="••••••••"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-2xl hover:scale-110 transition-transform opacity-80 hover:opacity-100"
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? '🐵' : '🙈'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-lg transition-all mt-4 shadow-[0_4px_14px_0_rgba(29,78,216,0.39)] hover:shadow-[0_6px_20px_rgba(29,78,216,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
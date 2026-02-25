import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function App() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      console.log("Intentando ingresar con:", email, password);

      // Buscamos en la tabla correcta 'emails_and_passwords'
      const { data, error } = await supabase
        .from('emails_and_passwords')
        .select('*')
        .eq('email', email)
        .eq('password', password);

      if (error) {
        alert('Error Supabase: ' + error.message);
        return;
      }

      // Si encuentra datos (data no está vacío), entra.
      if (data && data.length > 0) {
        navigate('/dashboard');
      } else {
        alert('Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      console.error(error);
      alert('Error inesperado.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <img src="/ALAMEX.jfif" alt="Logo Alamex" className="w-32 mb-4" />

      <label>Escribe el correo electrónico</label>
      <input
        type="email"
        className="border p-2 rounded-md"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label>Escribe la contraseña</label>
      <div className="flex gap-2 items-center">
        <input
          type={open ? 'text' : 'password'}
          className="border p-2 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl focus:outline-none"
        >
          {open ? '🐵' : '🙈'}
        </button>
      </div>

      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white p-2 rounded mt-4"
      >
        Ingresar
      </button>
    </div>
  );
}
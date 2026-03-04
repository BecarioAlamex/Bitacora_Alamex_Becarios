import { useState, useEffect } from 'react';
import { obtenerUsuarios } from '../../services/adminService';
import ListaUsuarios from './ListaUsuarios';
import FormularioCrearUsuario from './FormularioCrearUsuario';

export default function AdminUsuariosPrincipal() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      const data = await obtenerUsuarios();
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-slate-500">Cargando base de datos de usuarios...</div>;

  return (
    <div className="p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Administración de Usuarios</h2>
          <p className="text-slate-500">Control de acceso, roles y estados de conexión del sistema.</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg transform hover:-translate-y-1"
        >
          + Nuevo Usuario
        </button>
      </div>

      <ListaUsuarios usuarios={usuarios} onRefresh={cargarDatos} />

      {mostrarModal && (
        <FormularioCrearUsuario onClose={() => setMostrarModal(false)} />
      )}
    </div>
  );
}
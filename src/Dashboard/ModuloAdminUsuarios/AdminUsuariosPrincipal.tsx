import { useState, useEffect } from "react";
// Subimos dos niveles para llegar a src/ y entrar a services/
import { obtenerUsuarios } from "../../services/adminService";
import ListaUsuarios from "./ListaUsuarios";

export default function AdminUsuariosPrincipal() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarUsuarios = async () => {
    try {
      const data = await obtenerUsuarios();
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold animate-pulse">Cargando gestión de usuarios...</div>;

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Panel de Control de Usuarios</h2>
          <p className="text-slate-500 text-sm">Gestiona becarios, roles y estados de conexión.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition">
          + Crear Usuario
        </button>
      </div>

      <ListaUsuarios usuarios={usuarios} onRefresh={cargarUsuarios} />
    </div>
  );
}
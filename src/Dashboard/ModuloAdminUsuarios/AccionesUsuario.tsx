import { eliminarUsuario } from '../../services/adminService';

export default function AccionesUsuario({ userId, onRefresh }: { userId: string, onRefresh: () => void }) {
  const borrar = async () => {
    if (confirm("¿Eliminar usuario definitivamente?")) {
      const { error } = await eliminarUsuario(userId);
      if (!error) onRefresh();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      <button className="p-2 hover:bg-slate-100 rounded text-slate-500" title="Editar Permisos">⚙️</button>
      <button onClick={borrar} className="p-2 hover:bg-red-50 rounded text-red-500" title="Eliminar">🗑️</button>
    </div>
  );
}
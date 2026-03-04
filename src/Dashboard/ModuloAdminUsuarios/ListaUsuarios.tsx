import AccionesUsuario from './AccionesUsuario';
import EstadoConexion from './EstadoConexion';

export default function ListaUsuarios({ usuarios, onRefresh }: { usuarios: any[], onRefresh: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
          <tr>
            <th className="px-6 py-4">Usuario</th>
            <th className="px-6 py-4">Rol</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {usuarios.map(u => (
            <tr key={u.id} className="hover:bg-slate-50 transition">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-700">{u.nombre_completo}</div>
                <div className="text-xs text-slate-400">{u.email}</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">
                  {u.rol || 'Becario'}
                </span>
              </td>
              <td className="px-6 py-4"><EstadoConexion /></td>
              <td className="px-6 py-4"><AccionesUsuario userId={u.id} onRefresh={onRefresh} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
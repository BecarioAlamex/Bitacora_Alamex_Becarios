export default function FormularioCrearUsuario({ onClose }: { onClose: () => void }) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Registrar Nuevo Usuario</h3>
          <p className="text-slate-500 mb-6 text-sm">Esta función se conectará con la autenticación de Supabase próximamente.</p>
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Nombre Completo" className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="email" placeholder="Correo electrónico" className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            <button className="bg-blue-600 text-white py-3 rounded-xl font-bold mt-2">Crear Cuenta</button>
            <button onClick={onClose} className="text-slate-400 font-bold py-2">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }
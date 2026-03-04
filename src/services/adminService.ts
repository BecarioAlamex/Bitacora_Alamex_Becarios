import { supabase } from '../supabaseClient';

export const obtenerUsuarios = async () => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .order('nombre_completo', { ascending: true });
  if (error) throw error;
  return data;
};

export const eliminarUsuario = async (userId: string) => {
  const { error } = await supabase
    .from('perfiles')
    .delete()
    .eq('id', userId);
  return { error };
};
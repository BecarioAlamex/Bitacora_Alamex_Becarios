import { createClient } from '@supabase/supabase-js';

// AQUÍ VAMOS A PEGAR TUS CLAVES SECRETAS DE SUPABASE
const supabaseUrl = 'https://bddsykxhwfgumianzxqp.supabase.co';
const supabaseAnonKey = 'sb_publishable_PPRZmZHaTYZdyTDot_wmKQ_URkCO9Zc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

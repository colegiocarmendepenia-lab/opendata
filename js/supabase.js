// Configuración del cliente Supabase
const SUPABASE_URL = 'https://yjrrtufenyfuhdycueyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcnJ0dWZlbnlmdWhkeWN1ZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjA3NzEsImV4cCI6MjA3NDg5Njc3MX0.OiyO2QKj7nTYAS8-9QSMNqqjvV_1ZWX_KBJYZLmk5s4';

let _supabase = null;

// Función para inicializar el cliente
function initSupabase() {
    if (!_supabase) {
        console.log('[Supabase] Inicializando cliente...');
        if (!window.supabase) {
            throw new Error('Supabase no está cargado. Asegúrate de incluir el script de Supabase.');
        }
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Supabase] Cliente inicializado correctamente');
    }
    return _supabase;
}

// Exportar el cliente
export const supabase = initSupabase();
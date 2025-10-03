// Importar createClient desde el CDN de Supabase
const SUPABASE_URL = 'https://yjrrtufenyfuhdycueyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcnJ0dWZlbnlmdWhkeWN1ZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjA3NzEsImV4cCI6MjA3NDg5Njc3MX0.OiyO2QKj7nTYAS8-9QSMNqqjvV_1ZWX_KBJYZLmk5s4';
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funciones de utilidad para mostrar mensajes
export function mostrarError(mensaje) {
    const mensajesDiv = document.getElementById('mensajes');
    if (!mensajesDiv) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    mensajesDiv.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Función para mostrar mensajes de éxito
export function mostrarExito(mensaje) {
    const mensajesDiv = document.getElementById('mensajes');
    if (!mensajesDiv) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    mensajesDiv.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}
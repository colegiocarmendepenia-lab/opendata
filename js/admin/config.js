// Gestión de configuración
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar configuración al mostrar la sección
    document.querySelector('.nav-link[data-section="configuracion"]').addEventListener('click', () => {
        cargarConfiguracion();
    });
});

// Función para cargar configuración
async function cargarConfiguracion() {
    try {
        const configSection = document.getElementById('configuracionSection');
        configSection.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Configuración General</h5>
                        </div>
                        <div class="card-body">
                            <form id="configForm">
                                <div class="mb-3">
                                    <label class="form-label d-flex justify-content-between align-items-center">
                                        Modo Oscuro
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="darkMode">
                                        </div>
                                    </label>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Idioma</label>
                                    <select class="form-select" id="language">
                                        <option value="es">Español</option>
                                        <option value="en">English</option>
                                        <option value="gl">Galego</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Zona Horaria</label>
                                    <select class="form-select" id="timezone">
                                        <option value="Europe/Madrid">Europe/Madrid</option>
                                        <option value="UTC">UTC</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    Guardar Cambios
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Configuración de Notificaciones</h5>
                        </div>
                        <div class="card-body">
                            <form id="notificationForm">
                                <div class="mb-3">
                                    <label class="form-label d-flex justify-content-between align-items-center">
                                        Notificaciones por Email
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="emailNotifications">
                                        </div>
                                    </label>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label d-flex justify-content-between align-items-center">
                                        Notificaciones de Nuevos Usuarios
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="newUserNotifications">
                                        </div>
                                    </label>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label d-flex justify-content-between align-items-center">
                                        Notificaciones de Nuevos Datasets
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="newDatasetNotifications">
                                        </div>
                                    </label>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    Guardar Preferencias
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-12 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Backup y Restauración</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <button class="btn btn-success w-100 mb-3" onclick="generarBackup()">
                                        <i class="bi bi-download"></i> Generar Backup
                                    </button>
                                </div>
                                <div class="col-md-6">
                                    <button class="btn btn-warning w-100 mb-3" onclick="restaurarBackup()">
                                        <i class="bi bi-upload"></i> Restaurar Backup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cargar configuración actual
        const config = await obtenerConfiguracion();
        aplicarConfiguracion(config);

        // Event listeners
        document.getElementById('configForm').addEventListener('submit', guardarConfiguracion);
        document.getElementById('notificationForm').addEventListener('submit', guardarNotificaciones);
        document.getElementById('darkMode').addEventListener('change', toggleDarkMode);

    } catch (error) {
        console.error('Error al cargar configuración:', error.message);
        mostrarError('Error al cargar la configuración');
    }
}

// Función para obtener configuración
async function obtenerConfiguracion() {
    try {
        const { data: config, error } = await supabase
            .from('configuracion')
            .select('*')
            .single();

        if (error) throw error;

        return config || getDefaultConfig();
    } catch (error) {
        console.error('Error al obtener configuración:', error.message);
        return getDefaultConfig();
    }
}

// Función para guardar configuración
async function guardarConfiguracion(e) {
    e.preventDefault();
    
    try {
        const config = {
            dark_mode: document.getElementById('darkMode').checked,
            language: document.getElementById('language').value,
            timezone: document.getElementById('timezone').value
        };

        const { error } = await supabase
            .from('configuracion')
            .upsert([config]);

        if (error) throw error;

        mostrarExito('Configuración guardada exitosamente');
    } catch (error) {
        console.error('Error al guardar configuración:', error.message);
        mostrarError('Error al guardar la configuración');
    }
}

// Función para guardar notificaciones
async function guardarNotificaciones(e) {
    e.preventDefault();
    
    try {
        const config = {
            email_notifications: document.getElementById('emailNotifications').checked,
            new_user_notifications: document.getElementById('newUserNotifications').checked,
            new_dataset_notifications: document.getElementById('newDatasetNotifications').checked
        };

        const { error } = await supabase
            .from('configuracion')
            .upsert([config]);

        if (error) throw error;

        mostrarExito('Preferencias de notificaciones guardadas');
    } catch (error) {
        console.error('Error al guardar notificaciones:', error.message);
        mostrarError('Error al guardar las preferencias');
    }
}

// Función para generar backup
async function generarBackup() {
    try {
        // Obtener datos de todas las tablas
        const [usuarios, datasets, descargas, actividad] = await Promise.all([
            supabase.from('usuarios').select('*'),
            supabase.from('datasets').select('*'),
            supabase.from('descargas').select('*'),
            supabase.from('actividad').select('*')
        ]);

        const backup = {
            fecha: new Date().toISOString(),
            datos: {
                usuarios: usuarios.data,
                datasets: datasets.data,
                descargas: descargas.data,
                actividad: actividad.data
            }
        };

        // Descargar archivo
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        mostrarExito('Backup generado exitosamente');
    } catch (error) {
        console.error('Error al generar backup:', error.message);
        mostrarError('Error al generar el backup');
    }
}

// Función para restaurar backup
async function restaurarBackup() {
    // Por implementar
    alert('Función de restauración en desarrollo');
}

// Función para alternar modo oscuro
function toggleDarkMode(e) {
    document.body.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
}

// Función para obtener configuración por defecto
function getDefaultConfig() {
    return {
        dark_mode: false,
        language: 'es',
        timezone: 'Europe/Madrid',
        email_notifications: true,
        new_user_notifications: true,
        new_dataset_notifications: true
    };
}

// Función para aplicar configuración
function aplicarConfiguracion(config) {
    document.getElementById('darkMode').checked = config.dark_mode;
    document.getElementById('language').value = config.language;
    document.getElementById('timezone').value = config.timezone;
    document.getElementById('emailNotifications').checked = config.email_notifications;
    document.getElementById('newUserNotifications').checked = config.new_user_notifications;
    document.getElementById('newDatasetNotifications').checked = config.new_dataset_notifications;

    document.body.setAttribute('data-theme', config.dark_mode ? 'dark' : 'light');
}
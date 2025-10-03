// Dashboard Alumno
import { supabase, mostrarError, mostrarExito } from './auth.js';

const VERSION = '1.0.0';

// Configuración
const CONFIG = {
    permisosSoloLectura: ['calendario', 'avisos', 'horarios', 'calificaciones', 'asistencias']
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    inicializarDashboard();
    document.getElementById('btnLogout')?.addEventListener('click', handleLogout);
});

// Función para inicializar el dashboard
async function inicializarDashboard() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = '/login.html';
            return;
        }

        // Verificar rol y perfil
        const { data: usuario, error } = await supabase
            .from('usuarios_con_perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || usuario?.perfil_id !== 5) { // ID 5 = Alumno
            throw new Error('No tiene permisos para acceder a este dashboard');
        }

        // Configurar eventos de navegación
        configurarNavegacion();

        // Cargar sección inicial
        cargarSeccion('calificaciones');

    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        mostrarError(error.message);
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 3000);
    }
}

// Función para configurar la navegación
function configurarNavegacion() {
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const seccion = e.target.closest('.nav-link').dataset.section;
            cargarSeccion(seccion);
        });
    });
}

// Función para cargar una sección
async function cargarSeccion(seccion) {
    try {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        // Cargar datos según la sección
        switch (seccion) {
            case 'calendario':
                await cargarCalendario(mainContent);
                break;
            case 'avisos':
                await cargarAvisos(mainContent);
                break;
            case 'horarios':
                await cargarHorarios(mainContent);
                break;
            case 'calificaciones':
                await cargarCalificaciones(mainContent);
                break;
            case 'asistencias':
                await cargarAsistencias(mainContent);
                break;
            default:
                mainContent.innerHTML = '<div class="alert alert-warning">Sección no encontrada</div>';
        }
    } catch (error) {
        console.error(`Error al cargar sección ${seccion}:`, error);
        mostrarError(`Error al cargar la sección ${seccion}`);
    }
}

// Funciones para cargar cada sección
async function cargarCalendario(container) {
    // TODO: Implementar carga de calendario
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Calendario</h5>
            </div>
            <div class="card-body">
                <p>Contenido del calendario aquí</p>
            </div>
        </div>
    `;
}

async function cargarAvisos(container) {
    // TODO: Implementar carga de avisos
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Avisos</h5>
            </div>
            <div class="card-body">
                <p>Lista de avisos aquí</p>
            </div>
        </div>
    `;
}

async function cargarHorarios(container) {
    // TODO: Implementar carga de horarios
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Horarios</h5>
            </div>
            <div class="card-body">
                <p>Horarios aquí</p>
            </div>
        </div>
    `;
}

async function cargarCalificaciones(container) {
    try {
        // Obtener calificaciones del alumno
        const { data: { session } } = await supabase.auth.getSession();
        const { data: alumno, error: alumnoError } = await supabase
            .from('alumnos')
            .select('id')
            .eq('usuario_id', session.user.id)
            .single();

        if (alumnoError) throw alumnoError;

        const { data: calificaciones, error: calificacionesError } = await supabase
            .from('calificaciones')
            .select(`
                *,
                materias (nombre)
            `)
            .eq('alumno_id', alumno.id)
            .order('fecha', { ascending: false });

        if (calificacionesError) throw calificacionesError;

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Mis Calificaciones</h5>
                </div>
                <div class="card-body">
                    ${generarTablaCalificaciones(calificaciones)}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        mostrarError('Error al cargar las calificaciones');
    }
}

async function cargarAsistencias(container) {
    try {
        // Obtener asistencias del alumno
        const { data: { session } } = await supabase.auth.getSession();
        const { data: alumno, error: alumnoError } = await supabase
            .from('alumnos')
            .select('id')
            .eq('usuario_id', session.user.id)
            .single();

        if (alumnoError) throw alumnoError;

        const { data: asistencias, error: asistenciasError } = await supabase
            .from('asistencias')
            .select('*')
            .eq('alumno_id', alumno.id)
            .order('fecha', { ascending: false });

        if (asistenciasError) throw asistenciasError;

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Mi Registro de Asistencias</h5>
                </div>
                <div class="card-body">
                    ${generarTablaAsistencias(asistencias)}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar asistencias:', error);
        mostrarError('Error al cargar las asistencias');
    }
}

// Funciones para generar tablas
function generarTablaCalificaciones(calificaciones) {
    if (!calificaciones || calificaciones.length === 0) {
        return '<p class="text-muted">No hay calificaciones registradas</p>';
    }

    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Materia</th>
                        <th>Calificación</th>
                        <th>Fecha</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${calificaciones.map(c => `
                        <tr>
                            <td>${c.materias.nombre}</td>
                            <td>${c.calificacion}</td>
                            <td>${new Date(c.fecha).toLocaleDateString()}</td>
                            <td>${c.observaciones || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generarTablaAsistencias(asistencias) {
    if (!asistencias || asistencias.length === 0) {
        return '<p class="text-muted">No hay registro de asistencias</p>';
    }

    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${asistencias.map(a => `
                        <tr>
                            <td>${new Date(a.fecha).toLocaleDateString()}</td>
                            <td>
                                <span class="badge bg-${getEstadoAsistenciaBadge(a.estado)}">
                                    ${a.estado}
                                </span>
                            </td>
                            <td>${a.observaciones || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getEstadoAsistenciaBadge(estado) {
    switch(estado.toLowerCase()) {
        case 'presente': return 'success';
        case 'ausente': return 'danger';
        case 'tardanza': return 'warning';
        default: return 'secondary';
    }
}

// Función para cerrar sesión
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        mostrarError('Error al cerrar sesión');
    }
}

// Exportar funciones necesarias
window.handleLogout = handleLogout;
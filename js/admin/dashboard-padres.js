// Dashboard Padres
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

        if (error || usuario?.perfil_id !== 4) { // ID 4 = Padres
            throw new Error('No tiene permisos para acceder a este dashboard');
        }

        // Cargar lista de hijos
        await cargarListaHijos(session.user.id);

        // Configurar eventos de navegación
        configurarNavegacion();

        // Cargar sección inicial
        cargarSeccion('avisos');

    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        mostrarError(error.message);
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 3000);
    }
}

// Función para cargar la lista de hijos
async function cargarListaHijos(userId) {
    try {
        // TODO: Implementar la carga de hijos desde la base de datos
        const { data: hijos, error } = await supabase
            .from('alumnos')
            .select('*')
            .eq('padre_id', userId);

        if (error) throw error;

        const alumnosMenu = document.getElementById('alumnosMenu');
        if (!alumnosMenu) return;

        if (hijos && hijos.length > 0) {
            alumnosMenu.innerHTML = hijos.map(hijo => `
                <li>
                    <a class="dropdown-item" href="#" data-alumno-id="${hijo.id}">
                        ${hijo.nombre} ${hijo.apellido}
                    </a>
                </li>
            `).join('');

            // Configurar eventos para cada hijo
            alumnosMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const alumnoId = e.target.dataset.alumnoId;
                    cargarDatosAlumno(alumnoId);
                });
            });
        } else {
            alumnosMenu.innerHTML = `
                <li><span class="dropdown-item text-muted">No hay alumnos registrados</span></li>
            `;
        }
    } catch (error) {
        console.error('Error al cargar lista de hijos:', error);
        mostrarError('Error al cargar la lista de alumnos');
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
            default:
                mainContent.innerHTML = '<div class="alert alert-warning">Sección no encontrada</div>';
        }
    } catch (error) {
        console.error(`Error al cargar sección ${seccion}:`, error);
        mostrarError(`Error al cargar la sección ${seccion}`);
    }
}

// Función para cargar datos específicos de un alumno
async function cargarDatosAlumno(alumnoId) {
    try {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        // TODO: Implementar carga de datos del alumno
        const { data: alumno, error } = await supabase
            .from('alumnos')
            .select(`
                *,
                calificaciones (*),
                asistencias (*)
            `)
            .eq('id', alumnoId)
            .single();

        if (error) throw error;

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Información de ${alumno.nombre} ${alumno.apellido}</h5>
                </div>
                <div class="card-body">
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="nav-item">
                            <a class="nav-link active" data-bs-toggle="tab" href="#calificaciones">Calificaciones</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-bs-toggle="tab" href="#asistencias">Asistencias</a>
                        </li>
                    </ul>
                    <div class="tab-content mt-3">
                        <div class="tab-pane fade show active" id="calificaciones">
                            ${generarTablaCalificaciones(alumno.calificaciones)}
                        </div>
                        <div class="tab-pane fade" id="asistencias">
                            ${generarTablaAsistencias(alumno.asistencias)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar datos del alumno:', error);
        mostrarError('Error al cargar los datos del alumno');
    }
}

// Funciones para generar tablas de datos
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
                    </tr>
                </thead>
                <tbody>
                    ${calificaciones.map(c => `
                        <tr>
                            <td>${c.materia}</td>
                            <td>${c.calificacion}</td>
                            <td>${new Date(c.fecha).toLocaleDateString()}</td>
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
                            <td>${a.estado}</td>
                            <td>${a.observaciones || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Funciones para cargar secciones generales
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
// Dashboard Coordinador
import { supabase, mostrarError, mostrarExito } from './auth.js';

const VERSION = '1.0.0';

// Configuración
const CONFIG = {
    permisosEdicion: ['calendario', 'avisos', 'horarios'],
    permisosSoloLectura: ['calificaciones', 'asistencias']
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

        if (error || usuario?.perfil_id !== 2) { // ID 2 = Coordinador
            throw new Error('No tiene permisos para acceder a este dashboard');
        }

        // Configurar eventos de navegación
        configurarNavegacion();

        // Cargar sección inicial
        cargarSeccion('calendario');

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

        // Determinar si el usuario puede editar esta sección
        const puedeEditar = CONFIG.permisosEdicion.includes(seccion);

        // Cargar datos según la sección
        switch (seccion) {
            case 'calendario':
                await cargarCalendario(mainContent, puedeEditar);
                break;
            case 'avisos':
                await cargarAvisos(mainContent, puedeEditar);
                break;
            case 'horarios':
                await cargarHorarios(mainContent, puedeEditar);
                break;
            case 'calificaciones':
                await cargarCalificaciones(mainContent, false); // Solo lectura
                break;
            case 'asistencias':
                await cargarAsistencias(mainContent, false); // Solo lectura
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
async function cargarCalendario(container, puedeEditar) {
    // TODO: Implementar carga de calendario
    container.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Calendario</h5>
                ${puedeEditar ? '<button class="btn btn-primary btn-sm"><i class="bi bi-plus"></i> Nuevo Evento</button>' : ''}
            </div>
            <div class="card-body">
                <p>Contenido del calendario aquí</p>
            </div>
        </div>
    `;
}

async function cargarAvisos(container, puedeEditar) {
    // TODO: Implementar carga de avisos
    container.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Avisos</h5>
                ${puedeEditar ? '<button class="btn btn-primary btn-sm"><i class="bi bi-plus"></i> Nuevo Aviso</button>' : ''}
            </div>
            <div class="card-body">
                <p>Lista de avisos aquí</p>
            </div>
        </div>
    `;
}

async function cargarHorarios(container, puedeEditar) {
    // TODO: Implementar carga de horarios
    container.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Horarios</h5>
                ${puedeEditar ? '<button class="btn btn-primary btn-sm"><i class="bi bi-plus"></i> Nuevo Horario</button>' : ''}
            </div>
            <div class="card-body">
                <p>Horarios aquí</p>
            </div>
        </div>
    `;
}

async function cargarCalificaciones(container, puedeEditar) {
    // TODO: Implementar carga de calificaciones
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Calificaciones</h5>
            </div>
            <div class="card-body">
                <p>Vista de calificaciones aquí</p>
            </div>
        </div>
    `;
}

async function cargarAsistencias(container, puedeEditar) {
    // TODO: Implementar carga de asistencias
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Asistencias</h5>
            </div>
            <div class="card-body">
                <p>Registro de asistencias aquí</p>
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
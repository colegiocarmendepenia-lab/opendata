// Dashboard Coordinador
import { cargarEventosCalendario } from './calendario-ui.js';
import { cargarPublicacionesUI } from './publicaciones-ui.js';

const VERSION = '1.0.17';

// Inicializar Supabase
const SUPABASE_URL = 'https://yjrrtufenyfuhdycueyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcnJ0dWZlbnlmdWhkeWN1ZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjA3NzEsImV4cCI6MjA3NDg5Njc3MX0.OiyO2QKj7nTYAS8-9QSMNqqjvV_1ZWX_KBJYZLmk5s4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuración de tablas y campos
const TABLAS = {
    asistencias: {
        nombre: 'asistencias',
        campos: ['id', 'alumno_id', 'fecha', 'estado', 'observacion', 'created_at', 'updated_at']
    },
    publicaciones: {
        nombre: 'publicaciones',
        campos: ['id', 'titulo', 'contenido', 'tipo', 'fecha_publicacion', 'fecha_vigencia', 'estado', 'created_by', 'updated_at']
    },
    horario_escolar: {
        nombre: 'horario_escolar',
        campos: ['id', 'curso_id', 'dia_semana', 'hora_inicio', 'hora_fin', 'asignatura_id', 'docente_id', 'aula']
    },
    calendario_escolar: {
        nombre: 'calendario_escolar',
        campos: ['id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'tipo_evento', 'estado']
    },
    calificaciones: {
        nombre: 'calificaciones',
        campos: ['id', 'alumno_id', 'asignatura_id', 'evaluacion_id', 'nota', 'fecha', 'observacion']
    }
};

// Configuración
const CONFIG = {
    permisosEdicion: ['calendario', 'avisos', 'horarios', 'calificaciones', 'asistencias'],
    permisosSoloLectura: [],
    tiposPublicacion: ['aviso', 'noticia', 'circular'],
    estadosAsistencia: ['presente', 'ausente', 'justificado', 'atraso'],
    diasSemana: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    tiposEvento: ['clase', 'reunion', 'evaluacion', 'actividad', 'feriado']
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
                await cargarEventosCalendario(mainContent);
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

async function cargarAvisos(container, puedeEditar) {
    await cargarPublicacionesUI(container);
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
    try {
        // Preparar la interfaz
        container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Control de Calificaciones</h5>
                    <div class="btn-group">
                        <button class="btn btn-primary btn-sm" id="btnNuevaCalificacion">
                            <i class="bi bi-plus-circle"></i> Nueva Calificación
                        </button>
                        <button class="btn btn-success btn-sm" id="btnReporteCalificaciones">
                            <i class="bi bi-file-earmark-excel"></i> Reporte
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Filtros -->
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <select class="form-select" id="filtroCurso">
                                <option value="">Todos los cursos</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtroAsignatura">
                                <option value="">Todas las asignaturas</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtroEvaluacion">
                                <option value="">Todas las evaluaciones</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-outline-primary w-100" id="btnFiltrar">
                                <i class="bi bi-funnel"></i> Filtrar
                            </button>
                        </div>
                    </div>

                    <!-- Estadísticas -->
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="card bg-primary text-white">
                                <div class="card-body">
                                    <h6>Promedio General</h6>
                                    <h2 id="promedioGeneral">---</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <canvas id="graficoCalificaciones"></canvas>
                        </div>
                    </div>

                    <!-- Tabla de calificaciones -->
                    <div class="table-responsive">
                        <table class="table table-striped" id="tablaCalificaciones">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Alumno</th>
                                    <th>Asignatura</th>
                                    <th>Evaluación</th>
                                    <th>Nota</th>
                                    <th>Observación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Cargar datos iniciales
        const [cursos, asignaturas, evaluaciones, calificaciones] = await Promise.all([
            supabase.from('cursos').select('*').order('nombre'),
            supabase.from('asignaturas').select('*').order('nombre'),
            supabase.from('evaluaciones').select('*').order('fecha'),
            supabase.from('calificaciones').select(`
                *,
                alumno:alumno_id(nombre, apellido, curso_id),
                asignatura:asignatura_id(nombre),
                evaluacion:evaluacion_id(nombre)
            `).order('fecha', { ascending: false })
        ]);

        // Llenar selectores de filtro
        llenarSelect('filtroCurso', cursos.data, 'nombre');
        llenarSelect('filtroAsignatura', asignaturas.data, 'nombre');
        llenarSelect('filtroEvaluacion', evaluaciones.data, 'nombre');

        // Configurar DataTable
        const tabla = new DataTable('#tablaCalificaciones', {
            data: calificaciones.data.map(c => ({
                fecha: formatearFecha(c.fecha),
                alumno: `${c.alumno.apellido}, ${c.alumno.nombre}`,
                asignatura: c.asignatura.nombre,
                evaluacion: c.evaluacion.nombre,
                nota: formatearCalificacion(c.nota),
                observacion: c.observacion || '',
                acciones: `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${c.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${c.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                `
            })),
            columns: [
                { data: 'fecha' },
                { data: 'alumno' },
                { data: 'asignatura' },
                { data: 'evaluacion' },
                { data: 'nota' },
                { data: 'observacion' },
                { data: 'acciones' }
            ],
            order: [[0, 'desc']],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json'
            },
            responsive: true,
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ]
        });

        // Calcular y mostrar estadísticas
        const notas = calificaciones.data.map(c => c.nota);
        const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
        document.getElementById('promedioGeneral').textContent = promedio.toFixed(1);

        // Crear gráfico de distribución de notas
        const distribucion = {
            '1.0-2.9': notas.filter(n => n >= 1.0 && n < 3.0).length,
            '3.0-3.9': notas.filter(n => n >= 3.0 && n < 4.0).length,
            '4.0-4.9': notas.filter(n => n >= 4.0 && n < 5.0).length,
            '5.0-5.9': notas.filter(n => n >= 5.0 && n < 6.0).length,
            '6.0-7.0': notas.filter(n => n >= 6.0 && n <= 7.0).length
        };

        new Chart(document.getElementById('graficoCalificaciones'), {
            type: 'bar',
            data: {
                labels: Object.keys(distribucion),
                datasets: [{
                    label: 'Distribución de Notas',
                    data: Object.values(distribucion),
                    backgroundColor: [
                        '#dc3545', // Rojo
                        '#ffc107', // Amarillo
                        '#17a2b8', // Cyan
                        '#28a745', // Verde
                        '#007bff'  // Azul
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Configurar eventos
        document.getElementById('btnNuevaCalificacion').addEventListener('click', () => mostrarModalCalificacion());
        document.getElementById('btnReporteCalificaciones').addEventListener('click', generarReporteCalificaciones);
        document.getElementById('btnFiltrar').addEventListener('click', () => filtrarCalificaciones(tabla));
        
        tabla.on('click', '.btn-editar', function() {
            const id = this.dataset.id;
            editarCalificacion(id);
        });
        
        tabla.on('click', '.btn-eliminar', function() {
            const id = this.dataset.id;
            eliminarCalificacion(id);
        });

    } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        mostrarError('Error al cargar las calificaciones');
    }
}

async function cargarAsistencias(container, puedeEditar) {
    try {
        // Preparar la interfaz
        container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Control de Asistencias</h5>
                    <button class="btn btn-primary btn-sm" id="btnNuevaAsistencia">
                        <i class="bi bi-plus-circle"></i> Nueva Asistencia
                    </button>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="card bg-primary text-white">
                                <div class="card-body">
                                    <h6>Asistencia General</h6>
                                    <h2 id="porcentajeAsistencia">---%</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <canvas id="graficoAsistencia"></canvas>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped" id="tablaAsistencias">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Alumno</th>
                                    <th>Estado</th>
                                    <th>Observación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Obtener datos
        const { data: asistencias } = await supabase
            .from('asistencias')
            .select(`
                *,
                alumno:alumno_id(nombre, apellido)
            `)
            .order('fecha', { ascending: false });

        // Configurar DataTable
        const tabla = new DataTable('#tablaAsistencias', {
            data: asistencias.map(a => ({
                fecha: a.fecha,
                alumno: `${a.alumno.nombre} ${a.alumno.apellido}`,
                estado: formatearEstadoAsistencia(a.estado),
                observacion: a.observacion || '',
                acciones: `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${a.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${a.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                `
            })),
            columns: [
                { data: 'fecha' },
                { data: 'alumno' },
                { data: 'estado' },
                { data: 'observacion' },
                { data: 'acciones' }
            ],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json'
            },
            responsive: true
        });

        // Calcular estadísticas
        const total = asistencias.length;
        const presentes = asistencias.filter(a => a.estado === 'presente').length;
        const porcentaje = Math.round((presentes / total) * 100);

        // Actualizar indicador
        document.getElementById('porcentajeAsistencia').textContent = `${porcentaje}%`;

        // Crear gráfico
        const stats = {
            presente: asistencias.filter(a => a.estado === 'presente').length,
            ausente: asistencias.filter(a => a.estado === 'ausente').length,
            justificado: asistencias.filter(a => a.estado === 'justificado').length,
            atraso: asistencias.filter(a => a.estado === 'atraso').length
        };

        new Chart(document.getElementById('graficoAsistencia'), {
            type: 'bar',
            data: {
                labels: Object.keys(stats),
                datasets: [{
                    label: 'Asistencias por Estado',
                    data: Object.values(stats),
                    backgroundColor: [
                        '#28a745',
                        '#dc3545',
                        '#ffc107',
                        '#17a2b8'
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Eventos
        document.getElementById('btnNuevaAsistencia').addEventListener('click', mostrarModalAsistencia);
        tabla.on('click', '.btn-editar', function() {
            const id = this.dataset.id;
            editarAsistencia(id);
        });
        tabla.on('click', '.btn-eliminar', function() {
            const id = this.dataset.id;
            eliminarAsistencia(id);
        });

    } catch (error) {
        console.error('Error al cargar asistencias:', error);
        mostrarError('Error al cargar las asistencias');
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

// Funciones para el manejo de eventos del calendario
async function guardarEvento(evento) {
    try {
        if (evento.id) {
            // Actualizar evento existente
            const { error } = await supabase
                .from('calendario_escolar')
                .update({
                    descripcion: evento.descripcion,
                    fecha: evento.fecha,
                    tipo_evento: evento.tipo_evento
                })
                .eq('id', evento.id);

            if (error) throw error;
            mostrarMensaje('Evento actualizado correctamente', 'success');
        } else {
            // Crear nuevo evento
            const { error } = await supabase
                .from('calendario_escolar')
                .insert([{
                    descripcion: evento.descripcion,
                    fecha: evento.fecha,
                    tipo_evento: evento.tipo_evento
                }]);

            if (error) throw error;
            mostrarMensaje('Evento creado correctamente', 'success');
        }

        // Cerrar modal y recargar calendario
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEvento'));
        modal.hide();
        cargarSeccion('calendario');
    } catch (error) {
        console.error('Error al guardar evento:', error);
        mostrarMensaje('Error al guardar el evento', 'error');
    }
}

async function eliminarEvento(eventoId) {
    try {
        if (!confirm('¿Está seguro de eliminar este evento?')) return;

        const { error } = await supabase
            .from('calendario_escolar')
            .delete()
            .eq('id', eventoId);

        if (error) throw error;

        mostrarMensaje('Evento eliminado correctamente', 'success');
        
        // Cerrar modal y recargar calendario
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEvento'));
        modal.hide();
        cargarSeccion('calendario');
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        mostrarMensaje('Error al eliminar el evento', 'error');
    }
}

// Función para formatear fecha
function formatearFecha(fecha, incluirHora = true) {
    if (!fecha) return '';
    const f = new Date(fecha);
    return incluirHora ? 
        f.toISOString().slice(0, 16) : // Con hora (YYYY-MM-DDTHH:mm)
        f.toISOString().slice(0, 10);  // Solo fecha (YYYY-MM-DD)
}

// Exportar funciones necesarias
window.handleLogout = handleLogout;
window.guardarEvento = guardarEvento;
window.eliminarEvento = eliminarEvento;
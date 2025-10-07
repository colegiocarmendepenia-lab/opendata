// Módulo para la interfaz de usuario de horarios
import { obtenerHorariosPorCurso, obtenerCursos } from './horarios.js';
import { supabase, mostrarError, mostrarExito } from '../auth.js';

console.log('[Horarios UI] Iniciando módulo de interfaz de horarios...');

// Función para configurar los eventos del modal de horarios
function configurarModalHorario() {
    console.log('[Horarios UI] Configurando modal de horarios...');
    
    // Obtener referencias a los elementos del modal
    const btnNuevoHorario = document.getElementById('btnNuevoHorario');
    const modalHorario = document.getElementById('modalHorario');
    const formHorario = document.getElementById('formHorario');
    
    if (btnNuevoHorario) {
        console.log('[Horarios UI] Configurando botón nuevo horario...');
        btnNuevoHorario.addEventListener('click', () => {
            const modal = new bootstrap.Modal(modalHorario);
            modal.show();
        });
    } else {
        console.warn('[Horarios UI] No se encontró el botón de nuevo horario');
    }
    
    if (formHorario) {
        console.log('[Horarios UI] Configurando formulario de horario...');
        formHorario.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarHorario();
        });
    } else {
        console.warn('[Horarios UI] No se encontró el formulario de horario');
    }
}

// Versión del módulo UI
const VERSION = '1.0.32';

// Función para cargar la interfaz de horarios
export async function cargarHorariosUI(container) {
    console.log(`[Horarios UI v${VERSION}] Iniciando carga de horarios...`);
    try {
        // Preparar la interfaz
        container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Horarios Escolares</h5>
                    <button class="btn btn-primary" id="btnNuevoHorario">
                        <i class="bi bi-plus-circle"></i> Nuevo Horario
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="tablaHorarios">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Obtener y mostrar las publicaciones como ejemplo
        const { data: publicaciones, error } = await supabase
            .from('publicaciones')
            .select('*')
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        console.log('[Horarios UI] Datos de ejemplo obtenidos:', publicaciones);

        // Mostrar publicaciones en la tabla de horarios como ejemplo
        const tbody = document.querySelector('#tablaHorarios tbody');
        tbody.innerHTML = publicaciones.map(pub => `
            <tr>
                <td>${pub.titulo}</td>
                <td>${formatearFecha(pub.fecha_publicacion)}</td>
                <td>
                    <span class="badge ${pub.es_aviso_principal ? 'bg-success' : 'bg-secondary'}">
                        ${pub.es_aviso_principal ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-editar me-1" data-id="${pub.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${pub.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Inicializar DataTable
        const tabla = $('#tablaHorarios').DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
            },
            responsive: true,
            order: [[1, 'desc']]
        });

        // Configurar eventos
        document.getElementById('btnNuevoHorario').addEventListener('click', () => {
            mostrarModalHorario({
                modo: 'crear'
            });
        });

        // Configurar eventos de botones de acciones
        tbody.addEventListener('click', (e) => {
            const boton = e.target.closest('button');
            if (!boton) return;

            const id = boton.dataset.id;
            const publicacion = publicaciones.find(p => p.id === id);

            if (boton.classList.contains('btn-editar')) {
                mostrarModalHorario({
                    modo: 'editar',
                    ...publicacion
                });
            } else if (boton.classList.contains('btn-eliminar')) {
                confirmarEliminarHorario(id);
            }
        });

    } catch (error) {
        console.error('[Horarios UI] Error al cargar interfaz:', error);
        mostrarError('Error al cargar la interfaz de horarios');
    }
}

// Función para mostrar el horario en la tabla
function mostrarHorario(horarioEscolar) {
    console.log('[Horarios UI] Mostrando horario en la tabla:', horarioEscolar);
    
    const container = document.getElementById('horarioContainer');
    const tbody = document.getElementById('tablaHorario');
    if (!tbody) {
        console.error('[Horarios UI] No se encontró el elemento tablaHorario');
        return;
    }
    tbody.innerHTML = '';

    // Ordenar horario por hora de inicio y día
    const horarioPorHora = {};
    horarioEscolar.forEach(clase => {
        console.log('[Horarios UI] Procesando clase:', clase);
        const horaInicio = clase.hora_inicio;
        if (!horarioPorHora[horaInicio]) {
            horarioPorHora[horaInicio] = {
                lunes: '', martes: '', miercoles: '', jueves: '', viernes: ''
            };
        }

        const dia = obtenerDiaSemana(clase.dia_semana);
        
        horarioPorHora[horaInicio][dia] = `
            <div>
                <strong>${clase.materia || 'Sin materia'}</strong><br>
                <small>${clase.profesor || 'Sin profesor'}</small>
                <small class="d-block text-muted">
                    ${clase.nivel ? `Nivel: ${clase.nivel}<br>` : ''}
                    ${clase.turno ? `Turno: ${clase.turno}<br>` : ''}
                    ${clase.periodo ? `Periodo: ${clase.periodo}` : ''}
                </small>
            </div>
        `;
    });

    // Crear filas de la tabla
    Object.entries(horarioPorHora).forEach(([hora, clases]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="table-light">${formatearHora(hora)}</td>
            <td>${clases.lunes}</td>
            <td>${clases.martes}</td>
            <td>${clases.miercoles}</td>
            <td>${clases.jueves}</td>
            <td>${clases.viernes}</td>
        `;
        tbody.appendChild(tr);
    });

    container.style.display = 'block';
}

// Función para mostrar la lista de estudiantes
function mostrarEstudiantes(estudiantes) {
    const container = document.getElementById('estudiantesContainer');
    const tbody = document.querySelector('#tablaEstudiantes tbody');
    tbody.innerHTML = '';

    estudiantes.forEach(estudiante => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${estudiante.codigo_estudiante}</td>
            <td>${estudiante.personas?.nombre || ''}</td>
            <td>${estudiante.personas?.apellido || ''}</td>
            <td>${estudiante.grado}</td>
            <td>${estudiante.seccion}</td>
        `;
        tbody.appendChild(tr);
    });

    // Inicializar DataTable
    if ($.fn.DataTable.isDataTable('#tablaEstudiantes')) {
        $('#tablaEstudiantes').DataTable().destroy();
    }

    $('#tablaEstudiantes').DataTable({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        responsive: true,
        order: [[1, 'asc']] // Ordenar por nombre
    });

    container.style.display = 'block';
}

// Función auxiliar para obtener el nombre del día
function obtenerDiaSemana(dia) {
    console.log('[Horarios UI] Procesando día de la semana:', dia);
    const dias = {
        'Lunes': 'lunes',
        'Martes': 'martes',
        'Miércoles': 'miercoles',
        'Miercoles': 'miercoles',
        'Jueves': 'jueves',
        'Viernes': 'viernes',
        'LUNES': 'lunes',
        'MARTES': 'martes',
        'MIÉRCOLES': 'miercoles',
        'MIERCOLES': 'miercoles',
        'JUEVES': 'jueves',
        'VIERNES': 'viernes'
    };
    const diaFormateado = dias[dia];
    if (!diaFormateado) {
        console.warn('[Horarios UI] Día no reconocido:', dia);
    }
    return diaFormateado || '';
}

// Función auxiliar para formatear hora
function formatearHora(hora) {
    return hora.slice(0, 5); // Mostrar solo HH:MM
}

// Función para mostrar el modal de horario
function mostrarModalHorario(datos) {
    const modal = new bootstrap.Modal(document.getElementById('modalHorario'));
    const form = document.getElementById('formHorario');
    
    // Configurar formulario con los datos de la publicación como ejemplo
    form.horarioId.value = datos.id || '';
    form.titulo.value = datos.titulo || '';
    form.contenido.value = datos.contenido || '';
    form.fechaPublicacion.value = formatearFecha(datos.fecha_publicacion || new Date(), false);
    form.esAvisoPrincipal.checked = datos.es_aviso_principal || false;

    // Configurar título del modal
    document.getElementById('modalHorarioLabel').textContent = 
        datos.modo === 'crear' ? 'Nuevo Horario' : 'Editar Horario';

    // Mostrar/ocultar botón eliminar
    document.getElementById('btnEliminarHorario').style.display = 
        datos.modo === 'editar' ? 'block' : 'none';

    // Configurar eventos
    document.getElementById('btnGuardarHorario').onclick = async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        await guardarHorario(form);
    };

    document.getElementById('btnEliminarHorario').onclick = () => {
        if (datos.id) {
            confirmarEliminarHorario(datos.id);
        }
    };

    // Resetear validación
    form.classList.remove('was-validated');

    // Mostrar modal
    modal.show();
}

// Función para guardar horario
async function guardarHorario(form) {
    try {
        console.log('[Horarios UI] Iniciando guardado de horario...');
        
        // Obtener el usuario actual
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Horarios UI] Sesión de usuario:', session ? {
            id: session.user.id,
            email: session.user.email
        } : null);

        if (!session) {
            throw new Error('Debe iniciar sesión para crear un horario');
        }

        console.log('[Horarios UI] Preparando datos del horario...');
        const horario = {
            titulo: form.titulo.value.trim(),
            fecha_publicacion: form.fechaPublicacion.value,
            es_aviso_principal: form.esAvisoPrincipal.checked
        };

        const { data, error } = await supabase
            .from('horario')
            .insert([horario])
            .select();

        if (error) throw error;

        mostrarExito('Horario guardado exitosamente');
        
        // Cerrar modal y recargar
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalHorario'));
        modal.hide();
        cargarHorariosUI(document.getElementById('mainContent'));

    } catch (error) {
        console.error('[Horarios UI] Error al guardar horario:', error);
        mostrarError(error.message);
    }
}

// Función para confirmar eliminación
function confirmarEliminarHorario(id) {
    if (confirm('¿Está seguro de eliminar este horario?')) {
        supabase
            .from('horario')
            .delete()
            .eq('id', id)
            .then(() => {
                mostrarExito('Horario eliminado exitosamente');
                cargarHorariosUI(document.getElementById('mainContent'));
            })
            .catch(error => {
                console.error('[Horarios UI] Error al eliminar horario:', error);
                mostrarError('Error al eliminar el horario');
            });
    }
}

// Función auxiliar para formatear fechas
function formatearFecha(fecha, incluirHora = false) {
    if (!fecha) return '';
    const f = new Date(fecha);
    return incluirHora ? 
        f.toISOString().slice(0, 16) : // Con hora (YYYY-MM-DDTHH:mm)
        f.toISOString().slice(0, 10);  // Solo fecha (YYYY-MM-DD)
}
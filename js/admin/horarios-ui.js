// Módulo para la interfaz de usuario de horarios
import { supabase, mostrarError, mostrarExito } from '../auth.js';

console.log('[Horarios UI] Iniciando módulo de interfaz de horarios...');

// Versión del módulo UI
const VERSION = '1.0.36';

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
                                    <th>Curso</th>
                                    <th>Año</th>
                                    <th>Fecha Creación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Modal de Estudiantes -->
            <div class="modal fade" id="modalEstudiantes" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="estudiantesLabel">Estudiantes Asignados</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table" id="tablaEstudiantes">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Grado</th>
                                            <th>Sección</th>
                                            <th>Nombre</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="btnAsignarEstudiante">
                                <i class="bi bi-plus-circle"></i> Asignar Estudiante
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de Detalle de Horario -->
            <div class="modal fade" id="modalDetalleHorario" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="detalleHorarioLabel">Detalle del Horario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table" id="tablaDetalleHorario">
                                    <thead>
                                        <tr>
                                            <th>Día</th>
                                            <th>Horario</th>
                                            <th>Materia</th>
                                            <th>Profesor</th>
                                            <th>Nivel</th>
                                            <th>Turno</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="btnNuevoDetalle">
                                <i class="bi bi-plus-circle"></i> Agregar Detalle
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Obtener y mostrar los horarios
        const { data: horarios, error } = await supabase
            .from('horario')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        console.log('[Horarios UI] Horarios obtenidos:', horarios);

        // Mostrar horarios en la tabla
        const tbody = document.querySelector('#tablaHorarios tbody');
        tbody.innerHTML = horarios.map(horario => `
            <tr>
                <td>${horario.curso || 'Sin curso'}</td>
                <td>${horario.anio || new Date().getFullYear()}</td>
                <td>
                    <span class="badge bg-primary">
                        ${new Date(horario.created_at).toLocaleDateString()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info btn-ver-detalle me-1" data-id="${horario.id}" title="Ver detalle">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success btn-ver-estudiantes me-1" data-id="${horario.id}" title="Ver estudiantes">
                        <i class="bi bi-people"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary btn-editar me-1" data-id="${horario.id}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${horario.id}" title="Eliminar">
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
            order: [[0, 'asc']]
        });

        // Configurar eventos
        document.getElementById('btnNuevoHorario').addEventListener('click', () => {
            mostrarModalHorario({
                modo: 'crear'
            });
        });

        // Configurar eventos de botones de acciones
        tbody.addEventListener('click', async (e) => {
            const boton = e.target.closest('button');
            if (!boton) return;

            const id = boton.dataset.id;
            const horario = horarios.find(h => h.id.toString() === id);

            if (!horario) {
                console.error('[Horarios UI] No se encontró el horario con ID:', id);
                mostrarError('Error: No se encontró el horario');
                return;
            }

            if (boton.classList.contains('btn-editar')) {
                mostrarModalHorario({
                    modo: 'editar',
                    ...horario
                });
            } else if (boton.classList.contains('btn-eliminar')) {
                confirmarEliminarHorario(id);
            } else if (boton.classList.contains('btn-ver-detalle')) {
                await mostrarDetalleHorario(horario);
            } else if (boton.classList.contains('btn-ver-estudiantes')) {
                await mostrarEstudiantesHorario(horario);
            }
        });

    } catch (error) {
        console.error('[Horarios UI] Error al cargar interfaz:', error);
        mostrarError('Error al cargar la interfaz de horarios');
    }
}

// Función para mostrar el modal de horario
function mostrarModalHorario(datos) {
    const modal = new bootstrap.Modal(document.getElementById('modalHorario'));
    const form = document.getElementById('formHorario');
    
    // Configurar formulario
    form.horarioId.value = datos.id || '';
    form.curso.value = datos.curso || '';
    form.anio.value = datos.anio || new Date().getFullYear();

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
            curso: form.curso.value.trim(),
            anio: parseInt(form.anio.value) || new Date().getFullYear(),
            created_by: session.user.id
        };

        const { data, error } = form.horarioId.value ? 
            await supabase
                .from('horario')
                .update(horario)
                .eq('id', form.horarioId.value)
                .select() :
            await supabase
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

// Función para mostrar el detalle del horario
async function mostrarDetalleHorario(horario) {
    try {
        if (!horario || !horario.id) {
            throw new Error('Datos del horario no válidos');
        }
        console.log('[Horarios UI] Cargando detalle del horario:', horario);

        // Obtener los detalles del horario_escolar
        const { data: detalles, error } = await supabase
            .from('horario_escolar')
            .select(`
                id,
                dia_semana,
                hora_inicio,
                hora_fin,
                materia,
                profesor,
                nivel,
                turno
            `)
            .eq('id_horario', horario.id)
            .order('dia_semana', { ascending: true })
            .order('hora_inicio', { ascending: true });

        if (error) throw error;

        console.log('[Horarios UI] Detalles obtenidos:', detalles);

        // Preparar el contenido del modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetalleHorario'));
        const tbody = document.querySelector('#tablaDetalleHorario tbody');
        
        document.getElementById('detalleHorarioLabel').textContent = 
            `Detalle del Horario - ${horario.curso} (${horario.anio})`;

        tbody.innerHTML = detalles.map(detalle => `
            <tr>
                <td>${detalle.dia_semana || 'No especificado'}</td>
                <td>${detalle.hora_inicio ? detalle.hora_inicio.slice(0,5) : 'No especificado'} - 
                    ${detalle.hora_fin ? detalle.hora_fin.slice(0,5) : 'No especificado'}</td>
                <td>${detalle.materia || 'No especificado'}</td>
                <td>${detalle.profesor || 'No especificado'}</td>
                <td>
                    <span class="badge bg-secondary">
                        ${detalle.nivel || 'No especificado'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-info">
                        ${detalle.turno || 'No especificado'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-editar-detalle me-1" data-id="${detalle.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar-detalle" data-id="${detalle.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="text-center">No hay detalles disponibles</td></tr>';

        // Configurar el botón para agregar nuevo detalle
        document.getElementById('btnNuevoDetalle').onclick = () => {
            mostrarModalDetalleHorario({
                modo: 'crear',
                horario_id: horario.id
            });
        };

        // Mostrar el modal
        modal.show();

    } catch (error) {
        console.error('[Horarios UI] Error al cargar detalles:', error);
        mostrarError('Error al cargar los detalles del horario');
    }
}

// Función para mostrar los estudiantes asignados al horario
async function mostrarEstudiantesHorario(horario) {
    try {
        if (!horario || !horario.id) {
            throw new Error('Datos del horario no válidos');
        }
        console.log('[Horarios UI] Cargando estudiantes del horario:', horario);

        // Obtener los estudiantes asignados
        const { data: estudiantes, error } = await supabase
            .from('estudiantes')
            .select('*, persona:persona_id(id, nombres, apellidos)')
            .eq('id_horario', horario.id)
            .order('grado')
            .order('seccion');

        if (error) throw error;

        console.log('[Horarios UI] Estudiantes obtenidos:', estudiantes);

        // Preparar el contenido del modal
        const modal = new bootstrap.Modal(document.getElementById('modalEstudiantes'));
        const tbody = document.querySelector('#tablaEstudiantes tbody');
        
        document.getElementById('estudiantesLabel').textContent = 
            `Estudiantes Asignados al Horario - ${horario.curso} (${horario.anio})`;

        tbody.innerHTML = estudiantes.map(estudiante => `
            <tr>
                <td>${estudiante.codigo_estudiante}</td>
                <td>${estudiante.grado}</td>
                <td>${estudiante.seccion}</td>
                <td>${estudiante.persona ? 
                    `${estudiante.persona.nombres} ${estudiante.persona.apellidos}` : 
                    'No especificado'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-desasignar-estudiante" 
                            data-id="${estudiante.id}" 
                            title="Desasignar estudiante">
                        <i class="bi bi-person-dash"></i>
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center">No hay estudiantes asignados</td></tr>';

        // Configurar eventos de los botones
        tbody.addEventListener('click', async (e) => {
            const boton = e.target.closest('.btn-desasignar-estudiante');
            if (boton) {
                const estudianteId = boton.dataset.id;
                if (confirm('¿Está seguro de desasignar este estudiante del horario?')) {
                    try {
                        const { error } = await supabase
                            .from('estudiantes')
                            .update({ id_horario: null })
                            .eq('id', estudianteId);

                        if (error) throw error;
                        
                        mostrarExito('Estudiante desasignado exitosamente');
                        await mostrarEstudiantesHorario(horario);
                    } catch (error) {
                        console.error('[Horarios UI] Error al desasignar estudiante:', error);
                        mostrarError('Error al desasignar el estudiante');
                    }
                }
            }
        });

        // Configurar el botón para asignar nuevo estudiante
        document.getElementById('btnAsignarEstudiante').onclick = () => {
            // TODO: Implementar la funcionalidad para asignar estudiantes
            alert('Funcionalidad en desarrollo');
        };

        // Mostrar el modal
        modal.show();

    } catch (error) {
        console.error('[Horarios UI] Error al cargar estudiantes:', error);
        mostrarError('Error al cargar los estudiantes del horario');
    }
}
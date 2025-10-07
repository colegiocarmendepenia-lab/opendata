// M�dulo para la interfa                                <tr>
                                    <th>Curso</th>
                                    <th>Año</th>
                                    <th>Fecha Creación</th>
                                    <th>Acciones</th>
                                </tr>suario de horarios
import { supabase, mostrarError, mostrarExito } from '../auth.js';

console.log('[Horarios UI] Iniciando m�dulo de interfaz de horarios...');

// Versi�n del m�dulo UI
const VERSION = '1.0.32';

// Funci�n para cargar la interfaz de horarios
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
                                    <th>D�a</th>
                                    <th>Turno</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
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
                    <button class="btn btn-sm btn-outline-primary btn-editar me-1" data-id="${horario.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${horario.id}">
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
        tbody.addEventListener('click', (e) => {
            const boton = e.target.closest('button');
            if (!boton) return;

            const id = boton.dataset.id;
            const horario = horarios.find(h => h.id === id);

            if (boton.classList.contains('btn-editar')) {
                mostrarModalHorario({
                    modo: 'editar',
                    ...horario
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

// Funci�n para mostrar el modal de horario
function mostrarModalHorario(datos) {
    const modal = new bootstrap.Modal(document.getElementById('modalHorario'));
    const form = document.getElementById('formHorario');
    
    // Configurar formulario
    form.horarioId.value = datos.id || '';
    form.curso.value = datos.curso || '';
    form.anio.value = datos.anio || new Date().getFullYear();

    // Configurar t�tulo del modal
    document.getElementById('modalHorarioLabel').textContent = 
        datos.modo === 'crear' ? 'Nuevo Horario' : 'Editar Horario';

    // Mostrar/ocultar bot�n eliminar
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

    // Resetear validaci�n
    form.classList.remove('was-validated');

    // Mostrar modal
    modal.show();
}

// Funci�n para guardar horario
async function guardarHorario(form) {
    try {
        console.log('[Horarios UI] Iniciando guardado de horario...');
        
        // Obtener el usuario actual
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Horarios UI] Sesi�n de usuario:', session ? {
            id: session.user.id,
            email: session.user.email
        } : null);

        if (!session) {
            throw new Error('Debe iniciar sesi�n para crear un horario');
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

// Funci�n para confirmar eliminaci�n
function confirmarEliminarHorario(id) {
    if (confirm('�Est� seguro de eliminar este horario?')) {
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

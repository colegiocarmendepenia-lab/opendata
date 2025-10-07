// Módulo para la interfaz de usuario de publicaciones
console.log('[Publicaciones UI] Iniciando módulo...');

import { obtenerPublicaciones, crearPublicacion, actualizarPublicacion, eliminarPublicacion, validarPublicacion } from './publicaciones.js';
import { supabase, mostrarError } from '../auth.js';

console.log('[Publicaciones UI] Imports completados');

// Función para cargar las publicaciones en la interfaz
export async function cargarPublicacionesUI(container) {
    console.log('[Publicaciones UI] Iniciando carga de publicaciones...');
    try {
        // Preparar la interfaz
        container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Avisos y Publicaciones</h5>
                    <button class="btn btn-primary" id="btnNuevaPublicacion">
                        <i class="bi bi-plus-circle"></i> Nueva Publicación
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="tablaPublicaciones">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Fecha</th>
                                    <th>Principal</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Cargar publicaciones
        const publicaciones = await obtenerPublicaciones();
        console.log('[Publicaciones UI] Publicaciones obtenidas:', publicaciones);

        // Mostrar publicaciones en la tabla
        const tbody = document.querySelector('#tablaPublicaciones tbody');
        tbody.innerHTML = publicaciones.map(publicacion => `
            <tr>
                <td>${publicacion.titulo}</td>
                <td>${formatearFecha(publicacion.fecha_publicacion)}</td>
                <td>
                    <span class="badge ${publicacion.es_aviso_principal ? 'bg-success' : 'bg-secondary'}">
                        ${publicacion.es_aviso_principal ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${publicacion.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${publicacion.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Inicializar DataTable
        const tabla = $('#tablaPublicaciones').DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
            },
            responsive: true,
            order: [[1, 'desc']]
        });

        // Configurar eventos
        document.getElementById('btnNuevaPublicacion').addEventListener('click', () => {
            mostrarModalPublicacion({
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
                mostrarModalPublicacion({
                    modo: 'editar',
                    ...publicacion
                });
            } else if (boton.classList.contains('btn-eliminar')) {
                confirmarEliminarPublicacion(id);
            }
        });

    } catch (error) {
        console.error('[Publicaciones UI] Error al cargar publicaciones:', error);
        mostrarError('Error al cargar las publicaciones');
    }
}

// Función para mostrar el modal de publicación
function mostrarModalPublicacion(datos) {
    const modal = new bootstrap.Modal(document.getElementById('modalPublicacion'));
    const form = document.getElementById('formPublicacion');
    
    // Configurar formulario
    form.publicacionId.value = datos.id || '';
    form.titulo.value = datos.titulo || '';
    form.contenido.value = datos.contenido || '';
    form.fechaPublicacion.value = formatearFecha(datos.fecha_publicacion || new Date(), false);
    form.esAvisoPrincipal.checked = datos.es_aviso_principal || false;

    // Configurar título del modal
    document.getElementById('modalPublicacionLabel').textContent = 
        datos.modo === 'crear' ? 'Nueva Publicación' : 'Editar Publicación';

    // Mostrar/ocultar botón eliminar
    document.getElementById('btnEliminarPublicacion').style.display = 
        datos.modo === 'editar' ? 'block' : 'none';

    // Configurar eventos
    document.getElementById('btnGuardarPublicacion').onclick = async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        await guardarPublicacion(form);
    };

    document.getElementById('btnEliminarPublicacion').onclick = () => {
        if (datos.id) {
            confirmarEliminarPublicacion(datos.id);
        }
    };

    // Resetear validación
    form.classList.remove('was-validated');

    // Mostrar modal
    modal.show();
}

// Función para obtener el ID del administrador del usuario actual
async function obtenerIdAdministrador(userId) {
    console.log('[Publicaciones UI] Buscando ID de administrador para usuario:', userId);
    try {
        // Consultamos directamente la tabla administrador
        const { data, error } = await supabase
            .from('administrador')
            .select('id')
            .eq('auth_user_id', userId)
            .single();

        console.log('[Publicaciones UI] Resultado consulta administrador:', { data, error });
        
        console.log('[Publicaciones UI] Resultado de búsqueda de administrador:', { data, error });

        if (error) throw error;
        return data?.id;
    } catch (error) {
        console.error('[Publicaciones UI] Error al obtener ID de administrador:', error);
        return null;
    }
}

// Función para guardar publicación
async function guardarPublicacion(form) {
    try {
        console.log('[Publicaciones UI] Iniciando guardado de publicación...');
        
        // Obtener el usuario actual
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Publicaciones UI] Sesión de usuario:', session ? {
            id: session.user.id,
            email: session.user.email
        } : null);

        if (!session) {
            throw new Error('Debe iniciar sesión para crear una publicación');
        }

        console.log('[Publicaciones UI] Preparando datos de la publicación...');
        const publicacion = {
            titulo: form.titulo.value.trim(),
            contenido: form.contenido.value.trim(),
            fecha_publicacion: form.fechaPublicacion.value,
            es_aviso_principal: form.esAvisoPrincipal.checked,
            autor_id: session.user.id // Usamos el ID del usuario autenticado directamente
        };

        // Validar publicación
        const errores = validarPublicacion(publicacion);
        if (errores.length > 0) {
            throw new Error(errores.join('\n'));
        }

        if (form.publicacionId.value) {
            await actualizarPublicacion(form.publicacionId.value, publicacion);
        } else {
            await crearPublicacion(publicacion);
        }

        // Cerrar modal y recargar
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalPublicacion'));
        modal.hide();
        cargarPublicacionesUI(document.getElementById('mainContent'));

    } catch (error) {
        console.error('[Publicaciones UI] Error al guardar publicación:', error);
        mostrarError(error.message);
    }
}

// Función para confirmar eliminación
function confirmarEliminarPublicacion(id) {
    if (confirm('¿Está seguro de eliminar esta publicación?')) {
        eliminarPublicacion(id)
            .then(() => cargarPublicacionesUI(document.getElementById('mainContent')))
            .catch(error => {
                console.error('[Publicaciones UI] Error al eliminar publicación:', error);
                mostrarError('Error al eliminar la publicación');
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
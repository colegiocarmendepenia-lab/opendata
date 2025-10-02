import { supabase, mostrarError, mostrarExito } from './auth.js';

// Variables globales
let politicas = [];
let perfiles = [];
let tablas = [];

// Función para cargar las tablas de la base de datos
async function cargarTablas() {
    try {
        const { data, error } = await supabase
            .rpc('obtener_tablas_sistema');

        if (error) throw error;
        
        console.log('Datos recibidos de obtener_tablas_sistema:', data); // Para depuración
        
        tablas = data || [];

        // Actualizar selector de tablas
        const selectTabla = document.getElementById('nombreTabla');
        if (selectTabla) {
            selectTabla.innerHTML = `
                <option value="">Seleccione una tabla</option>
                ${tablas.map(tabla => {
                    // Verificar el tipo de dato recibido
                    console.log('Procesando tabla:', tabla); // Para depuración
                    
                    let nombreTabla = '';
                    if (typeof tabla === 'string') {
                        nombreTabla = tabla;
                    } else if (tabla && typeof tabla === 'object') {
                        nombreTabla = tabla.table_name || tabla.nombre || Object.values(tabla)[0] || '';
                    }
                    
                    if (!nombreTabla) {
                        console.warn('Nombre de tabla no válido:', tabla);
                        return '';
                    }
                    
                    return `<option value="${nombreTabla}">${nombreTabla}</option>`;
                }).join('')}
            `;
        }
    } catch (error) {
        console.error('Error al cargar tablas:', error);
        mostrarError('Error al cargar las tablas del sistema');
    }
}

// Función para cargar los perfiles
async function cargarPerfiles() {
    try {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .order('nombre');

        if (error) throw error;
        perfiles = data || [];

        // Actualizar selector de perfiles
        const selectPerfil = document.getElementById('perfilId');
        if (selectPerfil) {
            selectPerfil.innerHTML = `
                <option value="">Seleccione un perfil</option>
                ${perfiles.map(p => `
                    <option value="${p.id}">${p.nombre}</option>
                `).join('')}
            `;
        }
    } catch (error) {
        console.error('Error al cargar perfiles:', error);
        mostrarError('Error al cargar los perfiles');
    }
}

// Función para cargar las políticas existentes
async function cargarPoliticas() {
    try {
        // Mostrar indicador de carga
        const tabla = document.getElementById('tablaPoliticas');
        if (tabla) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <div class="mt-2">Cargando políticas...</div>
                    </td>
                </tr>
            `;
        }

        // Cargar las políticas primero
        const { data: politicasData, error: politicasError } = await supabase
            .from('politicas_seguridad')
            .select(`
                *,
                perfil:perfiles(id, nombre)
            `)
            .order('tabla');

        if (politicasError) throw politicasError;
        politicas = politicasData || [];
        
        // Actualizar la tabla inmediatamente con los datos que tenemos
        actualizarTablaPoliticas();

        // Cargar tablas y perfiles en paralelo
        await Promise.all([
            cargarTablas(),
            cargarPerfiles()
        ]);

        // Actualizar la tabla nuevamente por si hay cambios en los selectores
        actualizarTablaPoliticas();
    } catch (error) {
        console.error('Error al cargar políticas:', error);
        mostrarError('Error al cargar las políticas de seguridad');
        
        // Mostrar mensaje de error en la tabla
        const tabla = document.getElementById('tablaPoliticas');
        if (tabla) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error al cargar las políticas
                    </td>
                </tr>
            `;
        }
    }
}

// Función para actualizar la tabla de políticas
function actualizarTablaPoliticas() {
    const tabla = document.getElementById('tablaPoliticas');
    if (!tabla) return;

    tabla.innerHTML = politicas.map(politica => `
        <tr>
            <td>${politica.tabla}</td>
            <td>${politica.perfil ? politica.perfil.nombre : 'Sin perfil'}</td>
            <td>
                <span class="badge bg-${politica.consulta ? 'success' : 'danger'}">
                    ${politica.consulta ? 'Sí' : 'No'}
                </span>
            </td>
            <td>
                <span class="badge bg-${politica.insertar ? 'success' : 'danger'}">
                    ${politica.insertar ? 'Sí' : 'No'}
                </span>
            </td>
            <td>
                <span class="badge bg-${politica.actualizar ? 'success' : 'danger'}">
                    ${politica.actualizar ? 'Sí' : 'No'}
                </span>
            </td>
            <td>
                <span class="badge bg-${politica.eliminar ? 'success' : 'danger'}">
                    ${politica.eliminar ? 'Sí' : 'No'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="editarPolitica('${politica.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarPolitica('${politica.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para guardar una nueva política
async function guardarPolitica(politica) {
    try {
        // Verificar si ya existe una política para esta tabla y perfil
        const { data: existente, error: errorBusqueda } = await supabase
            .from('politicas_seguridad')
            .select('*')
            .eq('tabla', politica.tabla)
            .eq('perfil_id', politica.perfil_id);

        if (errorBusqueda) throw errorBusqueda;

        if (existente && existente.length > 0) {
            throw new Error('Ya existe una política para esta tabla y perfil');
        }

        const { data, error } = await supabase
            .from('politicas_seguridad')
            .insert([politica])
            .select();

        if (error) throw error;

        await cargarPoliticas();
        mostrarExito('Política guardada exitosamente');
        return data[0];
    } catch (error) {
        console.error('Error al guardar política:', error);
        mostrarError(error.message);
        throw error;
    }
}

// Función para actualizar una política existente
async function actualizarPolitica(id, politica) {
    try {
        const { data, error } = await supabase
            .from('politicas_seguridad')
            .update(politica)
            .eq('id', id)
            .select();

        if (error) throw error;

        await cargarPoliticas();
        mostrarExito('Política actualizada exitosamente');
        return data[0];
    } catch (error) {
        console.error('Error al actualizar política:', error);
        mostrarError('Error al actualizar la política');
        throw error;
    }
}

// Función para eliminar una política
async function eliminarPolitica(id) {
    if (!confirm('¿Está seguro de eliminar esta política?')) return;

    try {
        const { error } = await supabase
            .from('politicas_seguridad')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await cargarPoliticas();
        mostrarExito('Política eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar política:', error);
        mostrarError('Error al eliminar la política');
    }
}

// Función para editar una política existente
async function editarPolitica(id) {
    try {
        const politica = politicas.find(p => p.id === id);
        if (!politica) throw new Error('Política no encontrada');

        // Llenar el formulario con los datos de la política
        document.getElementById('nombreTabla').value = politica.tabla;
        document.getElementById('perfilId').value = politica.perfil_id;

        // Permisos
        document.getElementById('permiso_consulta').checked = politica.consulta;
        document.getElementById('permiso_insertar').checked = politica.insertar;
        document.getElementById('permiso_actualizar').checked = politica.actualizar;
        document.getElementById('permiso_eliminar').checked = politica.eliminar;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('nuevaPoliticaModal'));
        modal.show();

        // Guardar el ID de la política que se está editando
        document.getElementById('formPolitica').dataset.politicaId = id;
    } catch (error) {
        console.error('Error al editar política:', error);
        mostrarError('Error al cargar la política');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const btnGuardarPolitica = document.getElementById('btnGuardarPolitica');
    if (btnGuardarPolitica) {
        btnGuardarPolitica.addEventListener('click', async () => {
            try {
                const form = document.getElementById('formPolitica');
                const politicaId = form.dataset.politicaId;
                const politica = {
                    tabla: document.getElementById('nombreTabla').value,
                    perfil_id: document.getElementById('perfilId').value,
                    consulta: document.getElementById('permiso_consulta').checked,
                    insertar: document.getElementById('permiso_insertar').checked,
                    actualizar: document.getElementById('permiso_actualizar').checked,
                    eliminar: document.getElementById('permiso_eliminar').checked
                };

                if (politicaId) {
                    await actualizarPolitica(politicaId, politica);
                } else {
                    await guardarPolitica(politica);
                }

                // Cerrar modal y limpiar formulario
                const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaPoliticaModal'));
                modal.hide();
                form.reset();
                delete form.dataset.politicaId;
            } catch (error) {
                console.error('Error al guardar política:', error);
                mostrarError('Error al guardar la política');
            }
        });
    }

    // Cargar políticas cuando se muestra la sección
    document.querySelector('.nav-link[data-section="politicas"]').addEventListener('click', cargarPoliticas);
});

// Funciones auxiliares
function getPoliticaPermisos(tipo) {
    const permisos = [];
    if (document.getElementById(`${tipo}Publico`)?.checked) permisos.push('public');
    if (document.getElementById(`${tipo}Autenticado`)?.checked) permisos.push('authenticated');
    if (document.getElementById(`${tipo}Admin`)?.checked) permisos.push('admin');
    if (document.getElementById(`${tipo}Profesor`)?.checked) permisos.push('profesor');
    if (document.getElementById(`${tipo}Estudiante`)?.checked) permisos.push('estudiante');
    return permisos;
}

function getPoliticaBadgeColor(permisos) {
    if (permisos.includes('public')) return 'success';
    if (permisos.includes('authenticated')) return 'info';
    if (permisos.includes('admin')) return 'danger';
    return 'secondary';
}

function getPoliticaDescription(permisos) {
    if (permisos.length === 0) return 'Sin acceso';
    return permisos.join(', ');
}

// Exportar funciones para uso global
window.editarPolitica = editarPolitica;
window.eliminarPolitica = eliminarPolitica;
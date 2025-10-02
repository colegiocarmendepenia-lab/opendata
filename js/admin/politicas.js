import { supabase, mostrarError, mostrarExito } from './auth.js';

// Variable global para las políticas
let politicas = [];

// Función para cargar las políticas existentes
async function cargarPoliticas() {
    try {
        const { data, error } = await supabase
            .from('politicas_seguridad')
            .select('*')
            .order('tabla');

        if (error) throw error;

        politicas = data || [];
        actualizarTablaPoliticas();
    } catch (error) {
        console.error('Error al cargar políticas:', error);
        mostrarError('Error al cargar las políticas de seguridad');
    }
}

// Función para actualizar la tabla de políticas
function actualizarTablaPoliticas() {
    const tabla = document.getElementById('tablaPoliticas');
    if (!tabla) return;

    tabla.innerHTML = politicas.map(politica => `
        <tr>
            <td>${politica.tabla}</td>
            <td>
                <span class="badge bg-${getPoliticaBadgeColor(politica.consulta)}">
                    ${getPoliticaDescription(politica.consulta)}
                </span>
            </td>
            <td>
                <span class="badge bg-${getPoliticaBadgeColor(politica.insertar)}">
                    ${getPoliticaDescription(politica.insertar)}
                </span>
            </td>
            <td>
                <span class="badge bg-${getPoliticaBadgeColor(politica.actualizar)}">
                    ${getPoliticaDescription(politica.actualizar)}
                </span>
            </td>
            <td>
                <span class="badge bg-${getPoliticaBadgeColor(politica.eliminar)}">
                    ${getPoliticaDescription(politica.eliminar)}
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
        mostrarError('Error al guardar la política');
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

        // Consulta
        document.getElementById('consultaPublico').checked = politica.consulta.includes('public');
        document.getElementById('consultaAutenticado').checked = politica.consulta.includes('authenticated');
        document.getElementById('consultaAdmin').checked = politica.consulta.includes('admin');
        document.getElementById('consultaProfesor').checked = politica.consulta.includes('profesor');
        document.getElementById('consultaEstudiante').checked = politica.consulta.includes('estudiante');

        // Inserción
        document.getElementById('insertarAutenticado').checked = politica.insertar.includes('authenticated');
        document.getElementById('insertarAdmin').checked = politica.insertar.includes('admin');
        document.getElementById('insertarProfesor').checked = politica.insertar.includes('profesor');
        document.getElementById('insertarEstudiante').checked = politica.insertar.includes('estudiante');

        // Actualización
        document.getElementById('actualizarAutenticado').checked = politica.actualizar.includes('authenticated');
        document.getElementById('actualizarAdmin').checked = politica.actualizar.includes('admin');
        document.getElementById('actualizarProfesor').checked = politica.actualizar.includes('profesor');
        document.getElementById('actualizarEstudiante').checked = politica.actualizar.includes('estudiante');

        // Eliminación
        document.getElementById('eliminarAutenticado').checked = politica.eliminar.includes('authenticated');
        document.getElementById('eliminarAdmin').checked = politica.eliminar.includes('admin');
        document.getElementById('eliminarProfesor').checked = politica.eliminar.includes('profesor');
        document.getElementById('eliminarEstudiante').checked = politica.eliminar.includes('estudiante');

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
                    consulta: getPoliticaPermisos('consulta'),
                    insertar: getPoliticaPermisos('insertar'),
                    actualizar: getPoliticaPermisos('actualizar'),
                    eliminar: getPoliticaPermisos('eliminar')
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
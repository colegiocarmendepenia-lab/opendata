import { supabase, mostrarError, mostrarExito } from './auth.js';
import { obtenerPerfiles, crearPerfil, actualizarPerfil, eliminarPerfil } from './perfiles.js';

// Variable global para los perfiles
let perfiles = [];

// Función para cargar perfiles en la tabla
async function cargarTablaPerfiles() {
    try {
        perfiles = await obtenerPerfiles();
        const tabla = document.getElementById('tablaPerfiles');
        tabla.innerHTML = '';

        perfiles.forEach(perfil => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${perfil.id}</td>
                <td>${perfil.nombre}</td>
                <td>${perfil.descripcion}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="editarPerfil(${perfil.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarPerfil(${perfil.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tabla.appendChild(tr);
        });

        // Actualizar los selectores de perfil en el formulario de nuevo usuario
        const selectPerfil = document.getElementById('perfil');
        selectPerfil.innerHTML = '<option value="">Seleccione un perfil</option>';
        perfiles.forEach(perfil => {
            const option = document.createElement('option');
            option.value = perfil.id;
            option.textContent = perfil.nombre;
            selectPerfil.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar perfiles:', error);
        mostrarError('Error al cargar los perfiles');
    }
}

// Evento para guardar nuevo perfil
document.getElementById('btnGuardarPerfil').addEventListener('click', async () => {
    try {
        const nombrePerfil = document.getElementById('nombrePerfil').value.trim();
        const descripcionPerfil = document.getElementById('descripcionPerfil').value.trim();

        if (!nombrePerfil || !descripcionPerfil) {
            throw new Error('Todos los campos son requeridos');
        }

        await crearPerfil(nombrePerfil, descripcionPerfil);
        await cargarTablaPerfiles();
        
        // Cerrar modal y limpiar formulario
        const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoPerfilModal'));
        modal.hide();
        document.getElementById('formNuevoPerfil').reset();
    } catch (error) {
        console.error('Error al crear perfil:', error);
        mostrarError(error.message);
    }
});

// Función para editar perfil
window.editarPerfil = async (id) => {
    try {
        const perfil = perfiles.find(p => p.id === id);
        if (!perfil) throw new Error('Perfil no encontrado');

        // Aquí puedes implementar la lógica para editar el perfil
        // Por ejemplo, mostrar un modal con los datos del perfil
        const nombre = prompt('Nuevo nombre:', perfil.nombre);
        const descripcion = prompt('Nueva descripción:', perfil.descripcion);

        if (nombre && descripcion) {
            await actualizarPerfil(id, { nombre, descripcion });
            await cargarTablaPerfiles();
        }
    } catch (error) {
        console.error('Error al editar perfil:', error);
        mostrarError(error.message);
    }
};

// Función para eliminar perfil
window.eliminarPerfil = async (id) => {
    try {
        if (!confirm('¿Está seguro de eliminar este perfil?')) return;
        
        await eliminarPerfil(id);
        await cargarTablaPerfiles();
    } catch (error) {
        console.error('Error al eliminar perfil:', error);
        mostrarError(error.message);
    }
};

// Cargar perfiles cuando se muestra la sección
document.querySelector('.nav-link[data-section="perfiles"]').addEventListener('click', cargarTablaPerfiles);

// Inicialización
document.addEventListener('DOMContentLoaded', cargarTablaPerfiles);
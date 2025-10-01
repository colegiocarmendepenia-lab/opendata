// Gestión de usuarios
import auth, { supabase, mostrarError, mostrarExito } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a elementos del DOM
    const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
    const formNuevoUsuario = document.getElementById('formNuevoUsuario');

    // Event listeners
    if (btnGuardarUsuario) {
        btnGuardarUsuario.addEventListener('click', handleNuevoUsuario);
    }

    // Cargar lista de usuarios al mostrar la sección
    document.querySelector('.nav-link[data-section="usuarios"]').addEventListener('click', () => {
        cargarListaUsuarios();
    });
});

// Función para crear nuevo usuario
async function handleNuevoUsuario() {
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const rol = document.getElementById('rol').value;
    const password = generateTemporaryPassword(); // Generar contraseña temporal

    try {
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });

        if (authError) throw authError;

        // 2. Crear registro en tabla usuarios
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .insert([
                {
                    id: authData.user.id,
                    nombre: nombre,
                    email: email,
                    rol: rol
                }
            ]);

        if (userError) throw userError;

        // 3. Registrar actividad
        await registrarActividad('crear_usuario', authData.user.id);

        // 4. Mostrar mensaje de éxito
        mostrarExito('Usuario creado exitosamente');
        
        // 5. Cerrar modal y actualizar lista
        const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoUsuarioModal'));
        modal.hide();
        await cargarListaUsuarios();

    } catch (error) {
        console.error('Error al crear usuario:', error.message);
        mostrarError('Error al crear usuario: ' + error.message);
    }
}

// Función para cargar lista de usuarios
async function cargarListaUsuarios() {
    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Actualizar la sección de usuarios
        const usuariosSection = document.getElementById('usuariosSection');
        usuariosSection.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Gestión de Usuarios</h5>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#nuevoUsuarioModal">
                        <i class="bi bi-person-plus"></i> Nuevo Usuario
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Fecha de Creación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usuarios.map(usuario => `
                                    <tr>
                                        <td>${usuario.nombre || 'N/A'}</td>
                                        <td>${usuario.email}</td>
                                        <td><span class="badge bg-${getRolBadgeColor(usuario.rol)}">${usuario.rol}</span></td>
                                        <td>${new Date(usuario.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info" onclick="editarUsuario('${usuario.id}')">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="eliminarUsuario('${usuario.id}')">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar usuarios:', error.message);
        mostrarError('Error al cargar la lista de usuarios');
    }
}

// Función para editar usuario
async function editarUsuario(userId) {
    try {
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Implementar lógica de edición (modal, form, etc.)
        // Por ahora solo mostramos alerta
        alert('Función de edición en desarrollo');
    } catch (error) {
        console.error('Error al editar usuario:', error.message);
        mostrarError('Error al editar usuario');
    }
}

// Función para eliminar usuario
async function eliminarUsuario(userId) {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return;

    try {
        // 1. Eliminar usuario de Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        // 2. Eliminar registro de tabla usuarios
        const { error: userError } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', userId);

        if (userError) throw userError;

        // 3. Registrar actividad
        await registrarActividad('eliminar_usuario', userId);

        // 4. Actualizar lista
        await cargarListaUsuarios();

        // 5. Mostrar mensaje de éxito
        mostrarExito('Usuario eliminado exitosamente');

    } catch (error) {
        console.error('Error al eliminar usuario:', error.message);
        mostrarError('Error al eliminar usuario: ' + error.message);
    }
}

// Funciones auxiliares
function generateTemporaryPassword() {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
}

function getRolBadgeColor(rol) {
    switch(rol) {
        case 'admin': return 'danger';
        case 'profesor': return 'success';
        case 'estudiante': return 'info';
        default: return 'secondary';
    }
}

async function registrarActividad(tipo, usuarioId, detalles = {}) {
    try {
        await supabase
            .from('actividad')
            .insert([{
                usuario_id: usuarioId,
                tipo_accion: tipo,
                detalles: detalles
            }]);
    } catch (error) {
        console.error('Error al registrar actividad:', error.message);
    }
}

// Hacer las funciones disponibles globalmente para los botones en el HTML
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
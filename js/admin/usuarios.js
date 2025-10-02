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
    const email = document.getElementById('email').value.trim();
    const rol = document.getElementById('rol').value;
    const perfilId = document.getElementById('perfil').value;
    const password = generateTemporaryPassword(); // Generar contraseña temporal

    // Validar el email
    if (!email || !email.includes('@')) {
        mostrarError('Por favor, ingrese un email válido');
        return;
    }

    try {
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    rol: rol
                }
            }
        });

        if (authError) throw authError;

        // 2. Crear registro en tabla usuarios
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .insert([
                {
                    id: authData.user.id,
                    email: email,
                    rol: rol,
                    perfil_id: perfilId
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
            .from('usuarios_con_perfiles')
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
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Perfil</th>
                                    <th>Fecha de Creación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usuarios.map(usuario => `
                                    <tr>
                                        <td>${usuario.email}</td>
                                        <td><span class="badge bg-${getRolBadgeColor(usuario.rol)}">${usuario.rol}</span></td>
                                        <td><span class="badge bg-secondary">${usuario.perfil_nombre || 'Sin perfil'}</span></td>
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
            .from('usuarios_con_perfiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Obtener lista de perfiles para el selector
        const { data: perfiles, error: perfilesError } = await supabase
            .from('perfiles')
            .select('*')
            .order('nombre');

        if (perfilesError) throw perfilesError;

        // Crear y mostrar modal de edición
        const modalHtml = `
            <div class="modal fade" id="editarUsuarioModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Usuario</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarUsuario">
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" value="${usuario.email}" disabled>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Rol</label>
                                    <select class="form-select" id="editRol">
                                        <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                                        <option value="profesor" ${usuario.rol === 'profesor' ? 'selected' : ''}>Profesor</option>
                                        <option value="estudiante" ${usuario.rol === 'estudiante' ? 'selected' : ''}>Estudiante</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Perfil</label>
                                    <select class="form-select" id="editPerfil">
                                        <option value="">Sin perfil</option>
                                        ${perfiles.map(p => `
                                            <option value="${p.id}" ${p.id === usuario.perfil_id ? 'selected' : ''}>
                                                ${p.nombre}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="guardarCambiosUsuario('${userId}')">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = modalHtml;
        document.body.appendChild(modalWrapper);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('editarUsuarioModal'));
        modal.show();

        // Limpiar modal cuando se cierre
        document.getElementById('editarUsuarioModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        console.error('Error al editar usuario:', error.message);
        mostrarError('Error al editar usuario');
    }
}

// Función para guardar cambios del usuario
async function guardarCambiosUsuario(userId) {
    try {
        const rol = document.getElementById('editRol').value;
        const perfilId = document.getElementById('editPerfil').value || null;

        const { error } = await supabase
            .from('usuarios')
            .update({ 
                rol: rol,
                perfil_id: perfilId
            })
            .eq('id', userId);

        if (error) throw error;

        // Registrar actividad
        await registrarActividad('editar_usuario', userId);

        // Cerrar modal y actualizar lista
        const modal = bootstrap.Modal.getInstance(document.getElementById('editarUsuarioModal'));
        modal.hide();
        await cargarListaUsuarios();

        mostrarExito('Usuario actualizado exitosamente');
    } catch (error) {
        console.error('Error al guardar cambios:', error.message);
        mostrarError('Error al guardar los cambios');
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
window.guardarCambiosUsuario = guardarCambiosUsuario;
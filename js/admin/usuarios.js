// Gestión de usuarios
import auth, { supabase, mostrarError, mostrarExito } from './auth.js';

// Configuración
const CONFIG = {
    baseUrl: window.location.origin,
    defaultRedirect: '/login.html'
};

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM y event listeners
    const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
    const usuariosLink = document.querySelector('.nav-link[data-section="usuarios"]');
    
    if (btnGuardarUsuario) {
        btnGuardarUsuario.addEventListener('click', handleNuevoUsuario);
    }
    
    if (usuariosLink) {
        usuariosLink.addEventListener('click', cargarListaUsuarios);
    }
});

// Función para crear nuevo usuario
async function handleNuevoUsuario() {
    try {
        const email = document.getElementById('email').value.trim();
        const rol = document.getElementById('rol').value;
        const perfilId = document.getElementById('perfil').value;
        
        // Validación del email
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email || !emailRegex.test(email)) {
            mostrarError('Por favor, ingrese un email válido (ejemplo: usuario@dominio.com)');
            return;
        }

        if (!rol) {
            mostrarError('Por favor, seleccione un rol');
            return;
        }

        // Verificar si el usuario actual es administrador
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            throw new Error('No hay sesión activa');
        }

        // Obtener rol del usuario actual
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', session.user.id)
            .single();

        if (userError || userData?.rol !== 'admin') {
            throw new Error('No tiene permisos para crear usuarios');
        }

        // Generar contraseña temporal
        const password = generateTemporaryPassword();

        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { rol: rol },
                emailRedirectTo: `${window.location.origin}/login.html`
            }
        });

        if (authError) throw authError;
        
        if (!authData?.user?.id) {
            throw new Error('No se pudo crear el usuario en Auth');
        }

        // 2. Crear registro en tabla usuarios
        const { error: insertError } = await supabase
            .from('usuarios')
            .insert([{
                id: authData.user.id,
                email: email,
                rol: rol,
                perfil_id: perfilId || null
            }]);

        if (insertError) throw insertError;

        // 3. Registrar actividad
        await registrarActividad('crear_usuario', authData.user.id);

        // 4. Mostrar mensaje de éxito
        mostrarExito('Usuario creado exitosamente');
        
        // 5. Cerrar modal y actualizar lista
        const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoUsuarioModal'));
        if (modal) {
            modal.hide();
        }
        await cargarListaUsuarios();

    } catch (error) {
        console.error('Error al crear usuario:', error);
        mostrarError(error.message);
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

        const usuariosSection = document.getElementById('usuariosSection');
        if (!usuariosSection) return;

        const template = document.createElement('template');
        template.innerHTML = `
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
                                            <button class="btn btn-sm btn-info me-1" onclick="editarUsuario('${usuario.id}')">
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
        `.trim();
        
        usuariosSection.innerHTML = '';
        usuariosSection.appendChild(template.content);

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
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

        // Eliminar modal anterior si existe
        const modalAnterior = document.getElementById('editarUsuarioModal');
        if (modalAnterior) {
            modalAnterior.remove();
        }

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
        console.error('Error al editar usuario:', error);
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
        if (modal) {
            modal.hide();
        }
        
        await cargarListaUsuarios();
        mostrarExito('Usuario actualizado exitosamente');
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        mostrarError('Error al guardar los cambios');
    }
}

// Función para eliminar usuario
async function eliminarUsuario(userId) {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return;

    try {
        // 1. Como no tenemos acceso admin, solo desactivamos el usuario en nuestra tabla
        const { error: authError } = await supabase
            .from('usuarios')
            .update({ activo: false })
            .eq('id', userId);
        if (authError) throw authError;

        // 2. Eliminar registro de tabla usuarios
        const { error: userError } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', userId);

        if (userError) throw userError;

        // 3. Registrar actividad
        await registrarActividad('eliminar_usuario', userId);

        // 4. Actualizar lista y mostrar mensaje
        await cargarListaUsuarios();
        mostrarExito('Usuario eliminado exitosamente');

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        mostrarError('Error al eliminar usuario: ' + error.message);
    }
}

// Funciones auxiliares
function generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map(x => chars[x % chars.length])
        .join('');
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
        console.error('Error al registrar actividad:', error);
    }
}

// Exportar funciones para uso global
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.guardarCambiosUsuario = guardarCambiosUsuario;
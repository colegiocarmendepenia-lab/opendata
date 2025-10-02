import { supabase, mostrarError, mostrarExito } from './auth.js';

// Función para obtener todos los perfiles
export async function obtenerPerfiles() {
    try {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error al obtener perfiles:', error.message);
        mostrarError('Error al obtener los perfiles');
        return [];
    }
}

// Función para crear un nuevo perfil
export async function crearPerfil(nombre, descripcion) {
    try {
        const { data, error } = await supabase
            .from('perfiles')
            .insert([{ nombre, descripcion }])
            .select();

        if (error) throw error;
        mostrarExito('Perfil creado exitosamente');
        return data[0];
    } catch (error) {
        console.error('Error al crear perfil:', error.message);
        mostrarError('Error al crear el perfil');
        throw error;
    }
}

// Función para actualizar un perfil
export async function actualizarPerfil(id, { nombre, descripcion }) {
    try {
        const { data, error } = await supabase
            .from('perfiles')
            .update({ nombre, descripcion })
            .eq('id', id)
            .select();

        if (error) throw error;
        mostrarExito('Perfil actualizado exitosamente');
        return data[0];
    } catch (error) {
        console.error('Error al actualizar perfil:', error.message);
        mostrarError('Error al actualizar el perfil');
        throw error;
    }
}

// Función para eliminar un perfil
export async function eliminarPerfil(id) {
    try {
        const { error } = await supabase
            .from('perfiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
        mostrarExito('Perfil eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar perfil:', error.message);
        mostrarError('Error al eliminar el perfil');
        throw error;
    }
}

// Función para asignar perfil a usuario
export async function asignarPerfilUsuario(usuarioId, perfilId) {
    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ perfil_id: perfilId })
            .eq('id', usuarioId);

        if (error) throw error;
        mostrarExito('Perfil asignado exitosamente');
    } catch (error) {
        console.error('Error al asignar perfil:', error.message);
        mostrarError('Error al asignar el perfil');
        throw error;
    }
}
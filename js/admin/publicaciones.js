// Módulo para gestionar las publicaciones
console.log('[Publicaciones] Iniciando módulo...');

import { supabase, mostrarError, mostrarExito } from '../auth.js';

console.log('[Publicaciones] Imports completados');

// Función para obtener todas las publicaciones
export async function obtenerPublicaciones() {
    console.log('[Publicaciones] Obteniendo publicaciones desde Supabase...');
    try {
        const { data, error } = await supabase
            .from('publicaciones')
            .select(`
                id,
                titulo,
                contenido,
                fecha_publicacion,
                es_aviso_principal,
                autor_id,
                created_at
            `)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[Publicaciones] Error al obtener publicaciones:', error.message);
        mostrarError('Error al obtener las publicaciones');
        return [];
    }
}

// Función para crear una nueva publicación
export async function crearPublicacion(publicacion) {
    try {
        const { data, error } = await supabase
            .from('publicaciones')
            .insert([{
                titulo: publicacion.titulo,
                contenido: publicacion.contenido,
                fecha_publicacion: publicacion.fecha_publicacion,
                es_aviso_principal: publicacion.es_aviso_principal || false,
                autor_id: publicacion.autor_id
            }])
            .select();

        if (error) throw error;
        mostrarExito('Publicación creada exitosamente');
        return data[0];
    } catch (error) {
        console.error('[Publicaciones] Error al crear publicación:', error.message);
        mostrarError('Error al crear la publicación');
        throw error;
    }
}

// Función para actualizar una publicación
export async function actualizarPublicacion(id, publicacion) {
    try {
        const { data, error } = await supabase
            .from('publicaciones')
            .update({
                titulo: publicacion.titulo,
                contenido: publicacion.contenido,
                fecha_publicacion: publicacion.fecha_publicacion,
                es_aviso_principal: publicacion.es_aviso_principal
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        mostrarExito('Publicación actualizada exitosamente');
        return data[0];
    } catch (error) {
        console.error('[Publicaciones] Error al actualizar publicación:', error.message);
        mostrarError('Error al actualizar la publicación');
        throw error;
    }
}

// Función para eliminar una publicación
export async function eliminarPublicacion(id) {
    try {
        const { error } = await supabase
            .from('publicaciones')
            .delete()
            .eq('id', id);

        if (error) throw error;
        mostrarExito('Publicación eliminada exitosamente');
    } catch (error) {
        console.error('[Publicaciones] Error al eliminar publicación:', error.message);
        mostrarError('Error al eliminar la publicación');
        throw error;
    }
}

// Función para validar una publicación
export function validarPublicacion(publicacion) {
    const errores = [];

    if (!publicacion.titulo?.trim()) {
        errores.push('El título es requerido');
    }

    if (!publicacion.contenido?.trim()) {
        errores.push('El contenido es requerido');
    }

    if (!publicacion.fecha_publicacion) {
        errores.push('La fecha de publicación es requerida');
    }

    return errores;
}
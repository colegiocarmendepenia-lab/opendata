// Módulo para gestionar el calendario escolar
console.log('[Calendario Escolar] Iniciando módulo...');

import { supabase, mostrarError, mostrarExito } from '../auth.js';

console.log('[Calendario Escolar] Imports completados');

// Función para obtener todos los eventos del calendario
export async function obtenerEventos() {
    console.log('[Calendario Escolar] Obteniendo eventos desde Supabase...');
    try {
        const { data, error } = await supabase
            .from('calendario_escolar')
            .select('*')
            .order('fecha', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error al obtener eventos:', error.message);
        mostrarError('Error al obtener los eventos');
        return [];
    }
}

// Función para crear un nuevo evento
export async function crearEvento(evento) {
    try {
        const { data, error } = await supabase
            .from('calendario_escolar')
            .insert([{
                descripcion: evento.descripcion,
                fecha: evento.fecha,
                tipo_evento: evento.tipo_evento
            }])
            .select();

        if (error) throw error;
        mostrarExito('Evento creado exitosamente');
        return data[0];
    } catch (error) {
        console.error('Error al crear evento:', error.message);
        mostrarError('Error al crear el evento');
        throw error;
    }
}

// Función para actualizar un evento
export async function actualizarEvento(id, evento) {
    try {
        const { data, error } = await supabase
            .from('calendario_escolar')
            .update({
                descripcion: evento.descripcion,
                fecha: evento.fecha,
                tipo_evento: evento.tipo_evento
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        mostrarExito('Evento actualizado exitosamente');
        return data[0];
    } catch (error) {
        console.error('Error al actualizar evento:', error.message);
        mostrarError('Error al actualizar el evento');
        throw error;
    }
}

// Función para eliminar un evento
export async function eliminarEvento(id) {
    try {
        const { error } = await supabase
            .from('calendario_escolar')
            .delete()
            .eq('id', id);

        if (error) throw error;
        mostrarExito('Evento eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar evento:', error.message);
        mostrarError('Error al eliminar el evento');
        throw error;
    }
}

// Función para validar un evento
export function validarEvento(evento) {
    const errores = [];

    if (!evento.descripcion?.trim()) {
        errores.push('La descripción es requerida');
    }

    if (!evento.fecha) {
        errores.push('La fecha es requerida');
    }

    if (!evento.tipo_evento) {
        errores.push('El tipo de evento es requerido');
    } else if (!['clase', 'evaluacion', 'reunion', 'actividad', 'feriado'].includes(evento.tipo_evento)) {
        errores.push('El tipo de evento no es válido');
    }

    return errores;
}
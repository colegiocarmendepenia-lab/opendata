// Servicios de datos para el dashboard de coordinador

import { supabase } from '../auth.js';
import { TABLAS } from './config.js';

// Servicios para Publicaciones
export const publicacionesService = {
    async listar() {
        const { data, error } = await supabase
            .from(TABLAS.publicaciones.nombre)
            .select('*')
            .order('fecha_publicacion', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async crear(publicacion) {
        const { data, error } = await supabase
            .from(TABLAS.publicaciones.nombre)
            .insert([publicacion])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async actualizar(id, publicacion) {
        const { data, error } = await supabase
            .from(TABLAS.publicaciones.nombre)
            .update(publicacion)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async eliminar(id) {
        const { error } = await supabase
            .from(TABLAS.publicaciones.nombre)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    }
};

// Servicios para Calendario
export const calendarioService = {
    async listarEventos() {
        const { data, error } = await supabase
            .from(TABLAS.calendario_escolar.nombre)
            .select('*')
            .order('fecha_inicio', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    async crearEvento(evento) {
        const { data, error } = await supabase
            .from(TABLAS.calendario_escolar.nombre)
            .insert([evento])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async actualizarEvento(id, evento) {
        const { data, error } = await supabase
            .from(TABLAS.calendario_escolar.nombre)
            .update(evento)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async eliminarEvento(id) {
        const { error } = await supabase
            .from(TABLAS.calendario_escolar.nombre)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    }
};

// Servicios para Horarios
export const horariosService = {
    async listar() {
        const { data, error } = await supabase
            .from(TABLAS.horario_escolar.nombre)
            .select(`
                *,
                curso:curso_id(*),
                asignatura:asignatura_id(*),
                docente:docente_id(*)
            `)
            .order('dia_semana', { ascending: true })
            .order('hora_inicio', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    async crear(horario) {
        const { data, error } = await supabase
            .from(TABLAS.horario_escolar.nombre)
            .insert([horario])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async actualizar(id, horario) {
        const { data, error } = await supabase
            .from(TABLAS.horario_escolar.nombre)
            .update(horario)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async eliminar(id) {
        const { error } = await supabase
            .from(TABLAS.horario_escolar.nombre)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    }
};

// Servicios para Calificaciones
export const calificacionesService = {
    async listar() {
        const { data, error } = await supabase
            .from(TABLAS.calificaciones.nombre)
            .select(`
                *,
                alumno:alumno_id(*),
                asignatura:asignatura_id(*),
                evaluacion:evaluacion_id(*)
            `)
            .order('fecha', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async crear(calificacion) {
        const { data, error } = await supabase
            .from(TABLAS.calificaciones.nombre)
            .insert([calificacion])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async actualizar(id, calificacion) {
        const { data, error } = await supabase
            .from(TABLAS.calificaciones.nombre)
            .update(calificacion)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async eliminar(id) {
        const { error } = await supabase
            .from(TABLAS.calificaciones.nombre)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    },

    async obtenerEstadisticas() {
        const { data, error } = await supabase
            .from(TABLAS.calificaciones.nombre)
            .select(`
                asignatura:asignatura_id(nombre),
                nota
            `);
        
        if (error) throw error;
        
        // Procesar estadísticas
        const stats = {};
        data.forEach(cal => {
            const asignatura = cal.asignatura.nombre;
            if (!stats[asignatura]) {
                stats[asignatura] = {
                    total: 0,
                    count: 0,
                    min: 7,
                    max: 1
                };
            }
            stats[asignatura].total += cal.nota;
            stats[asignatura].count++;
            stats[asignatura].min = Math.min(stats[asignatura].min, cal.nota);
            stats[asignatura].max = Math.max(stats[asignatura].max, cal.nota);
        });

        // Calcular promedios
        Object.keys(stats).forEach(asignatura => {
            stats[asignatura].promedio = 
                Math.round((stats[asignatura].total / stats[asignatura].count) * 10) / 10;
        });

        return stats;
    }
};

// Servicios para Asistencias
export const asistenciasService = {
    async listar() {
        const { data, error } = await supabase
            .from(TABLAS.asistencias.nombre)
            .select(`
                *,
                alumno:alumno_id(*)
            `)
            .order('fecha', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    async crear(asistencia) {
        const { data, error } = await supabase
            .from(TABLAS.asistencias.nombre)
            .insert([asistencia])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async actualizarMultiple(asistencias) {
        const { data, error } = await supabase
            .from(TABLAS.asistencias.nombre)
            .upsert(asistencias)
            .select();
        
        if (error) throw error;
        return data;
    },

    async obtenerEstadisticas() {
        const { data, error } = await supabase
            .from(TABLAS.asistencias.nombre)
            .select('estado');
        
        if (error) throw error;
        
        // Procesar estadísticas
        const stats = {
            total: data.length,
            presente: 0,
            ausente: 0,
            justificado: 0,
            atraso: 0
        };

        data.forEach(asistencia => {
            stats[asistencia.estado]++;
        });

        return stats;
    }
};

// Servicios para datos auxiliares
export const auxiliaresService = {
    async listarCursos() {
        const { data, error } = await supabase
            .from('cursos')
            .select('*')
            .order('nombre');
        
        if (error) throw error;
        return data;
    },

    async listarAsignaturas() {
        const { data, error } = await supabase
            .from('asignaturas')
            .select('*')
            .order('nombre');
        
        if (error) throw error;
        return data;
    },

    async listarDocentes() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('perfil_id', 3) // ID 3 = Docente
            .order('nombre');
        
        if (error) throw error;
        return data;
    },

    async listarAlumnos() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('perfil_id', 2) // ID 2 = Alumno
            .order('nombre');
        
        if (error) throw error;
        return data;
    },

    async listarEvaluaciones() {
        const { data, error } = await supabase
            .from('evaluaciones')
            .select('*')
            .order('fecha');
        
        if (error) throw error;
        return data;
    }
};
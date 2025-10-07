// Módulo para gestionar los horarios
import { supabase } from '../auth.js';

console.log('[Horarios] Iniciando módulo de servicio de horarios...');
console.log('[Horarios] Instancia de Supabase disponible:', !!supabase);

// Función para obtener los horarios por curso
export async function obtenerHorariosPorCurso(curso, anio = new Date().getFullYear()) {
    console.log(`[Horarios] Obteniendo horarios para curso ${curso} del año ${anio}`);
    console.log('[Horarios] Estado de Supabase:', !!supabase);
    try {
        const { data: horario, error: horarioError } = await supabase
            .from('horario')
            .select('id, curso')
            .eq('curso', curso)
            .eq('anio', anio)
            .single();

        if (horarioError) throw horarioError;

        if (!horario) {
            console.log('[Horarios] No se encontró horario para el curso');
            return { horario: null, horarioEscolar: [], estudiantes: [] };
        }

        // Obtener detalle del horario escolar
        const { data: horarioEscolar, error: horarioEscolarError } = await supabase
            .from('horario_escolar')
            .select(`
                id,
                nivel,
                turno,
                curso,
                dia_semana,
                hora_inicio,
                hora_fin,
                periodo,
                materia,
                profesor
            `)
            .eq('id_horario', horario.id)
            .order('dia_semana', { ascending: true })
            .order('hora_inicio', { ascending: true });

        if (horarioEscolarError) throw horarioEscolarError;

        // Obtener estudiantes del curso
        const { data: horarioEstudiantes, error: estudiantesError } = await supabase
            .from('horario_estudiante')
            .select(`
                estudiantes (
                    id,
                    codigo_estudiante,
                    grado,
                    seccion,
                    persona_id,
                    personas (
                        nombre,
                        apellido
                    )
                )
            `)
            .eq('id_horario', horario.id)
            .eq('anio', anio);

        if (estudiantesError) throw estudiantesError;

        return {
            horario,
            horarioEscolar,
            estudiantes: horarioEstudiantes.map(he => he.estudiantes)
        };
    } catch (error) {
        console.error('[Horarios] Error al obtener horarios:', error.message);
        throw error;
    }
}

// Función para obtener la lista de cursos disponibles
export async function obtenerCursos(anio = new Date().getFullYear()) {
    console.log(`[Horarios] Obteniendo lista de cursos del año ${anio}`);
    try {
        const { data, error } = await supabase
            .from('horario')
            .select('curso')
            .eq('anio', anio)
            .order('curso');

        if (error) throw error;
        return data.map(h => h.curso);
    } catch (error) {
        console.error('[Horarios] Error al obtener cursos:', error.message);
        throw error;
    }
}
// Módulo para gestionar los horarios
import { supabase, mostrarError } from '../auth.js';

const VERSION = '1.0.33';
console.log(`[Horarios v${VERSION}] Iniciando módulo de servicio de horarios...`);
console.log('[Horarios] Versión del módulo:', VERSION);
console.log('[Horarios] URL de Supabase:', supabase?.supabaseUrl);
console.log('[Horarios] Cliente Supabase:', {
    auth: !!supabase?.auth,
    storage: !!supabase?.storage,
    functions: !!supabase?.functions
});

// Función para obtener los horarios por curso
export async function obtenerHorariosPorCurso(curso, anio = new Date().getFullYear()) {
    console.log(`[Horarios] Obteniendo horarios para curso ${curso} del año ${anio}`);
    console.log('[Horarios] Estado de Supabase:', !!supabase);
    try {
        console.log('[Horarios] Consultando tabla horario para el curso:', curso);
        const { data: horario, error: horarioError } = await supabase
            .from('horario')
            .select('*')
            .eq('curso', curso)
            .eq('anio', anio)
            .single();

        console.log('[Horarios] Resultado consulta horario:', { data: horario, error: horarioError });

        if (horarioError) {
            console.error('[Horarios] Error al obtener horario:', horarioError);
            throw horarioError;
        }

        if (!horario) {
            console.log('[Horarios] No se encontró horario para el curso');
            return { horario: null, horarioEscolar: [], estudiantes: [] };
        }

        console.log('[Horarios] Consultando tabla horario_escolar para id_horario:', horario.id);
        // Obtener detalle del horario escolar
        const { data: horarioEscolar, error: horarioEscolarError } = await supabase
            .from('horario_escolar')
            .select('*')
            .eq('id_horario', horario.id)
            .order('dia_semana', { ascending: true })
            .order('hora_inicio', { ascending: true });

        console.log('[Horarios] Resultado consulta horario_escolar:', { 
            data: horarioEscolar, 
            error: horarioEscolarError 
        });

        if (horarioEscolarError) {
            console.error('[Horarios] Error al obtener horario_escolar:', horarioEscolarError);
            throw horarioEscolarError;
        }

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
    console.log('[Horarios] Consultando horarios para el año:', anio);
    try {
        const { data, error } = await supabase
            .from('horario')
            .select('id, curso, anio, created_at')
            .eq('anio', anio)
            .order('curso');

        if (error) {
            console.error('[Horarios] Error al obtener horarios:', error.message);
            mostrarError('Error al obtener los horarios');
            return [];
        }

        console.log('[Horarios] Registros obtenidos:', data);
        const cursos = [...new Set(data.filter(h => h.curso).map(h => h.curso))];
        console.log('[Horarios] Cursos encontrados:', cursos);

        return cursos;
    } catch (error) {
        console.error('[Horarios] Error en obtenerCursos:', error.message);
        mostrarError('Error al obtener los horarios');
        return [];
    }
}
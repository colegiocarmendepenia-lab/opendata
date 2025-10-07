// Módulo para gestionar los horarios
import { supabase } from '../auth.js';

console.log('[Horarios] Iniciando módulo de servicio de horarios...');
console.log('[Horarios] Instancia de Supabase disponible:', !!supabase);

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
    try {
        console.log('[Horarios] Consultando horarios para el año:', anio);
        
        // Primero, veamos todos los registros sin filtro para verificar los datos
        const { data: todosLosRegistros, error: errorTodos } = await supabase
            .from('horario')
            .select('id, curso, anio');
            
        console.log('[Horarios] Todos los registros en la tabla:', todosLosRegistros);
        
        // Ahora hacemos la consulta con filtro
        const { data, error } = await supabase
            .from('horario')
            .select('id, curso, anio')
            .eq('anio', parseInt(anio)) // Convertimos el año a entero
            .is('curso', 'not.null') // Solo cursos no nulos
            .order('curso', { ascending: true });

        if (error) {
            console.error('[Horarios] Error al consultar horarios:', error);
            throw error;
        }

        console.log('[Horarios] Registros filtrados por año:', data);

        // Extraer solo los cursos únicos y no nulos
        const cursos = [...new Set(data.filter(h => h.curso).map(h => h.curso))];
        console.log('[Horarios] Cursos encontrados:', cursos);
        
        return cursos;
    } catch (error) {
        console.error('[Horarios] Error en obtenerCursos:', error);
        return [];
    }
}
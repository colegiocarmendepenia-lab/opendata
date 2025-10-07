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
    console.log(`[Horarios] Obteniendo lista de cursos del año ${anio}`);
    try {
        console.log('[Horarios] Ejecutando consulta a la tabla horario...');
        
        // Ejecutar la consulta simple
        const { data: todosLosRegistros, error: errorTodos } = await supabase
            .from('horario')
            .select('*')
            .eq('anio', anio)
            .order('curso');
            
        console.log('[Horarios] Todos los registros en horario:', todosLosRegistros, 'Error:', errorTodos);
        
        // Ahora hacemos la consulta específica
        const { data, error } = await supabase
            .from('horario')
            .select('curso')
            .eq('anio', anio)
            .not('curso', 'is', null)
            .order('curso');

        if (error) {
            console.error('[Horarios] Error al obtener cursos:', error);
            console.error('[Horarios] Detalles adicionales:', {
                codigo: error.code,
                mensaje: error.message,
                detalles: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('[Horarios] Datos obtenidos de la tabla horario:', data);
        // Filtrar cursos nulos y duplicados
        const cursos = [...new Set(data.map(h => h.curso).filter(Boolean))];
        console.log('[Horarios] Lista de cursos procesada:', cursos);
        
        if (cursos.length === 0) {
            const mensaje = 'No se encontraron cursos en la base de datos. ' + 
                          (permisoError ? 'Error de permisos: ' + permisoError.message : 
                           'Verifique que tenga los permisos necesarios.');
            console.warn('[Horarios] ' + mensaje);
            throw new Error(mensaje);
        }
        
        return cursos;
    } catch (error) {
        console.error('[Horarios] Error al obtener cursos:', error);
        throw error;
    }
}
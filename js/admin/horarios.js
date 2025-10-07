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
        // Verificar estado de autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('[Horarios] Estado de autenticación:', { user, error: authError });

        console.log('[Horarios] Ejecutando consulta simple a la tabla horario...');
        console.log('[Horarios] URL de Supabase:', supabase.supabaseUrl);
        
        const { data, error } = await supabase
            .from('horario')
            .select('*')
            .order('curso');
            
        console.log('[Horarios] Resultados de la tabla horario:', {
            datos: data,
            error: error,
            tipoError: error ? error.constructor.name : null,
            mensajeError: error ? error.message : null,
            codigoError: error ? error.code : null
        });

        if (error) {
            console.error('[Horarios] Error detallado al obtener horarios:', {
                mensaje: error.message,
                codigo: error.code,
                detalles: error.details,
                sugerencia: error.hint
            });
            throw error;
        }

        if (!data) {
            console.log('[Horarios] No se encontraron datos en la tabla horario');
            return [];
        }

        console.log('[Horarios] Datos obtenidos exitosamente:', {
            cantidad: data.length,
            primeros3: data.slice(0, 3)
        });
        
        return data;
    } catch (error) {
        console.error('[Horarios] Error detallado en obtenerCursos:', {
            tipo: error.constructor.name,
            mensaje: error.message,
            stack: error.stack
        });
        throw error;
    }
}
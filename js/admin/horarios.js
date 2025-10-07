// Módulo para gestionar los horarios
import { supabase } from '../auth.js';

console.log('[Horarios] Iniciando módulo de servicio de horarios...');
console.log('[Horarios] Instancia de Supabase disponible:', !!supabase);

// Función para verificar permisos
async function verificarPermisos() {
    console.log('[Horarios] Verificando permisos...');
    try {
        // Obtener información del usuario actual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.error('[Horarios] No hay sesión activa');
            return { tienePermisoInsertar: false, error: new Error('No hay sesión activa') };
        }

        // Obtener el perfil del usuario
        const { data: perfil, error: perfilError } = await supabase
            .from('usuarios_con_perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        console.log('[Horarios] Perfil del usuario:', perfil);
        
        if (perfilError) {
            console.error('[Horarios] Error al obtener perfil:', perfilError);
            return { tienePermisoInsertar: false, error: perfilError };
        }

        // Intentar insertar un registro de prueba
        const registroPrueba = {
            curso: '_test_',
            anio: 2025,
            created_by: session.user.id
        };
        
        console.log('[Horarios] Intentando insertar registro de prueba:', registroPrueba);
        const { data: insertData, error: insertError } = await supabase
            .from('horario')
            .insert([registroPrueba])
            .select();
            
        if (insertError) {
            console.error('[Horarios] Error al insertar:', insertError);
            return { tienePermisoInsertar: false, error: insertError };
        }

        // Si llegamos aquí, la inserción fue exitosa, eliminemos el registro de prueba
        if (insertData && insertData[0]?.id) {
            console.log('[Horarios] Eliminando registro de prueba...');
            const { error: deleteError } = await supabase
                .from('horario')
                .delete()
                .eq('id', insertData[0].id);
                
            if (deleteError) {
                console.error('[Horarios] Error al eliminar registro de prueba:', deleteError);
            }
        }

        return { tienePermisoInsertar: true, error: null };
    } catch (error) {
        console.error('[Horarios] Error al verificar permisos:', error);
        return { tienePermisoInsertar: false, error };
    }
}

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
        const sesion = await supabase.auth.getSession();
        console.log('[Horarios] Estado de sesión actual:', sesion);
        
        // Verificar permisos
        const { tienePermisoInsertar, error: permisoError } = await verificarPermisos();
        console.log('[Horarios] Resultado verificación de permisos:', { tienePermisoInsertar, error: permisoError });
        console.log('[Horarios] Ejecutando consulta a la tabla horario...');
        
        // Obtener información del usuario actual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('No hay sesión activa');
        }

        // Obtener el perfil del usuario
        const { data: perfil, error: perfilError } = await supabase
            .from('usuarios_con_perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (perfilError) {
            console.error('[Horarios] Error al obtener perfil:', perfilError);
            throw perfilError;
        }

        console.log('[Horarios] Perfil del usuario:', perfil);
        
        // Construir la consulta según el perfil
        let query = supabase.from('horario').select('*');
        
        // Si es coordinador (perfil_id = 2), puede ver todos los horarios
        // Si es docente (perfil_id = 3), solo ve los horarios asignados
        // Si es otro perfil, aplicar restricciones según sea necesario
        if (perfil.perfil_id !== 2) {
            console.log('[Horarios] Usuario no es coordinador, aplicando filtros...');
            query = query.eq('created_by', session.user.id);
        }

        // Ejecutar la consulta
        const { data: todosLosRegistros, error: errorTodos } = await query;
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
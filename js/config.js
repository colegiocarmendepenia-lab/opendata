// Configuración de tablas y campos
export const TABLAS = {
    asistencias: {
        nombre: 'asistencias',
        campos: ['id', 'alumno_id', 'fecha', 'estado', 'observacion', 'created_at', 'updated_at']
    },
    publicaciones: {
        nombre: 'publicaciones',
        campos: ['id', 'titulo', 'contenido', 'tipo', 'fecha_publicacion', 'fecha_vigencia', 'estado', 'created_by', 'updated_at']
    },
    horario_escolar: {
        nombre: 'horario_escolar',
        campos: ['id', 'curso_id', 'dia_semana', 'hora_inicio', 'hora_fin', 'asignatura_id', 'docente_id', 'aula']
    },
    calendario_escolar: {
        nombre: 'calendario_escolar',
        campos: ['id', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'tipo_evento', 'estado']
    },
    calificaciones: {
        nombre: 'calificaciones',
        campos: ['id', 'alumno_id', 'asignatura_id', 'evaluacion_id', 'nota', 'fecha', 'observacion']
    }
};
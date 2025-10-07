// Módulo para inicializar datos de prueba
import { supabase } from '../auth.js';

console.log('[Init Data] Iniciando módulo de datos de prueba...');

// Función para insertar datos de prueba en la tabla horario
async function insertarHorariosPrueba() {
    console.log('[Init Data] Insertando horarios de prueba...');
    try {
        // Insertar horarios (cabecera)
        const { data: horarios, error: errorHorarios } = await supabase
            .from('horario')
            .insert([
                { curso: '1° Básico A', anio: 2025 },
                { curso: '1° Básico B', anio: 2025 },
                { curso: '2° Básico A', anio: 2025 }
            ])
            .select();

        if (errorHorarios) throw errorHorarios;
        console.log('[Init Data] Horarios insertados:', horarios);

        // Para cada horario, insertar detalles
        for (const horario of horarios) {
            const detalles = [];
            const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            const materias = ['Matemáticas', 'Lenguaje', 'Ciencias', 'Historia', 'Educación Física'];
            const profesores = ['Juan Pérez', 'María González', 'Pedro Rodríguez', 'Ana Silva', 'Carlos López'];

            // Crear horarios para cada día
            dias.forEach((dia, diaIndex) => {
                // Crear 4 bloques por día
                for (let bloque = 1; bloque <= 4; bloque++) {
                    const horaInicio = `${7 + bloque}:00`;
                    const horaFin = `${7 + bloque + 1}:00`;
                    const materiaIndex = (diaIndex + bloque) % materias.length;

                    detalles.push({
                        id_horario: horario.id,
                        nivel: horario.curso.split('°')[0] + '° Básico',
                        turno: 'Mañana',
                        curso: horario.curso,
                        dia_semana: dia,
                        hora_inicio: horaInicio,
                        hora_fin: horaFin,
                        periodo: `Bloque ${bloque}`,
                        materia: materias[materiaIndex],
                        profesor: profesores[materiaIndex]
                    });
                }
            });

            // Insertar detalles del horario
            const { data: detallesHorario, error: errorDetalles } = await supabase
                .from('horario_escolar')
                .insert(detalles)
                .select();

            if (errorDetalles) throw errorDetalles;
            console.log(`[Init Data] Detalles insertados para ${horario.curso}:`, detallesHorario);
        }

        console.log('[Init Data] Datos de prueba insertados correctamente');
        return true;
    } catch (error) {
        console.error('[Init Data] Error al insertar datos de prueba:', error);
        throw error;
    }
}

// Función para verificar si ya existen datos
async function verificarDatosExistentes() {
    console.log('[Init Data] Verificando si existen datos...');
    try {
        const { count, error } = await supabase
            .from('horario')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        console.log('[Init Data] Cantidad de horarios existentes:', count);
        return count > 0;
    } catch (error) {
        console.error('[Init Data] Error al verificar datos:', error);
        throw error;
    }
}

// Función principal de inicialización
export async function inicializarDatosPrueba() {
    try {
        const existenDatos = await verificarDatosExistentes();
        if (!existenDatos) {
            await insertarHorariosPrueba();
            console.log('[Init Data] Datos de prueba inicializados correctamente');
        } else {
            console.log('[Init Data] Ya existen datos en la base de datos');
        }
    } catch (error) {
        console.error('[Init Data] Error en la inicialización:', error);
        throw error;
    }
}
// Funciones de utilidad
function mostrarError(mensaje) {
    const alertaError = document.getElementById('alerta-error');
    if (alertaError) {
        alertaError.textContent = mensaje;
        alertaError.classList.remove('d-none');
        setTimeout(() => alertaError.classList.add('d-none'), 5000);
    } else {
        console.error(mensaje);
    }
}

function llenarSelect(selectElement, opciones, valorKey = 'id', textoKey = 'nombre') {
    selectElement.innerHTML = '<option value="">Seleccione...</option>';
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion[valorKey];
        option.textContent = opcion[textoKey];
        selectElement.appendChild(option);
    });
}

// Función para cargar las materias
async function cargarMaterias() {
    try {
        const { data: materias, error } = await supabase
            .from('materias')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

        const selectMateria = document.getElementById('materia-select');
        if (selectMateria) {
            llenarSelect(selectMateria, materias, 'nombre', 'nombre');
        }
    } catch (error) {
        mostrarError('Error al cargar materias: ' + error.message);
    }
}

// Función para cargar los períodos
function cargarPeriodos() {
    const periodos = ['Primer Periodo', 'Segundo Periodo', 'Tercer Periodo', 'Cuarto Periodo'];
    const selectPeriodo = document.getElementById('periodo-select');
    if (selectPeriodo) {
        selectPeriodo.innerHTML = '<option value="">Seleccione un período...</option>';
        periodos.forEach(periodo => {
            const option = document.createElement('option');
            option.value = periodo;
            option.textContent = periodo;
            selectPeriodo.appendChild(option);
        });
    }
}

// Función para cargar estudiantes
async function cargarEstudiantes() {
    try {
        const { data: estudiantes, error } = await supabase
            .from('estudiantes')
            .select(`
                id,
                codigo_estudiante,
                grado,
                seccion,
                personas:persona_id (
                    nombre,
                    apellido,
                    email
                )
            `)
            .order('grado', { ascending: true });

        if (error) throw error;

        const selectEstudiante = document.getElementById('estudiante-select');
        if (selectEstudiante) {
            llenarSelect(selectEstudiante, estudiantes, 'id', (estudiante) => 
                `${estudiante.personas.apellido}, ${estudiante.personas.nombre} - ${estudiante.grado} ${estudiante.seccion}`);
        }
    } catch (error) {
        mostrarError('Error al cargar estudiantes: ' + error.message);
    }
}

import { mostrarError, mostrarExito, llenarSelect } from './utils.js';

// Función para cargar calificaciones
async function cargarCalificaciones() {
    try {
        const { data: calificaciones, error } = await supabase
            .from('calificaciones')
            .select(`
                id,
                estudiante_id,
                materia,
                periodo,
                nota,
                fecha_registro,
                estudiantes:estudiante_id (
                    codigo_estudiante,
                    grado,
                    seccion,
                    personas:persona_id (
                        nombre,
                        apellido
                    )
                )
            `)
            .order('fecha_registro', { ascending: false });

        if (error) throw error;

        const tablaBody = document.getElementById('calificaciones-tabla-body');
        if (!tablaBody) return;

        tablaBody.innerHTML = '';

        calificaciones.forEach(calificacion => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${calificacion.estudiantes?.personas?.apellido}, ${calificacion.estudiantes?.personas?.nombre} (${calificacion.estudiantes?.grado} ${calificacion.estudiantes?.seccion})</td>
                <td>${calificacion.evaluaciones?.nombre}</td>
                <td>${calificacion.asignaturas?.nombre}</td>
                <td>${calificacion.nota}</td>
                <td>${new Date(calificacion.fecha_registro).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editarCalificacion('${calificacion.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarCalificacion('${calificacion.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tablaBody.appendChild(fila);
        });
    } catch (error) {
        mostrarError('Error al cargar calificaciones: ' + error.message);
    }
}

// Función para agregar una calificación
async function agregarCalificacion(event) {
    event.preventDefault();
    
    const estudiante_id = document.getElementById('estudiante-select').value;
    const periodo = document.getElementById('periodo-select').value;
    const materia = document.getElementById('materia-select').value;
    const nota = parseFloat(document.getElementById('nota-input').value);

    if (!estudiante_id || !periodo || !materia || isNaN(nota)) {
        mostrarError('Por favor complete todos los campos');
        return;
    }

    if (nota < 0 || nota > 100) {
        mostrarError('La nota debe estar entre 0 y 100');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('calificaciones')
            .insert([
                { 
                    estudiante_id,
                    periodo,
                    materia,
                    nota,
                    fecha_registro: new Date().toISOString().split('T')[0]
                }
            ]);

        if (error) throw error;

        document.getElementById('form-calificacion').reset();
        await cargarCalificaciones();
        mostrarMensajeExito('Calificación agregada exitosamente');
    } catch (error) {
        mostrarError('Error al agregar calificación: ' + error.message);
    }
}

// Función para editar una calificación
async function editarCalificacion(id) {
    try {
        const { data: calificacion, error } = await supabase
            .from('calificaciones')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Llenar el formulario con los datos actuales
        document.getElementById('estudiante-select').value = calificacion.estudiante_id;
        document.getElementById('periodo-select').value = calificacion.periodo;
        document.getElementById('materia-select').value = calificacion.materia;
        document.getElementById('nota-input').value = calificacion.nota;

        // Cambiar el formulario a modo edición
        document.getElementById('calificacion-id').value = id;
        document.getElementById('btn-submit').textContent = 'Actualizar Calificación';
        document.getElementById('form-title').textContent = 'Editar Calificación';
    } catch (error) {
        mostrarError('Error al cargar calificación: ' + error.message);
    }
}

// Función para eliminar una calificación
async function eliminarCalificacion(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta calificación?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('calificaciones')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await cargarCalificaciones();
        mostrarMensajeExito('Calificación eliminada exitosamente');
    } catch (error) {
        mostrarError('Error al eliminar calificación: ' + error.message);
    }
}

// Función para mostrar mensaje de éxito
function mostrarMensajeExito(mensaje) {
    const alertaExito = document.getElementById('alerta-exito');
    if (alertaExito) {
        alertaExito.textContent = mensaje;
        alertaExito.classList.remove('d-none');
        setTimeout(() => alertaExito.classList.add('d-none'), 3000);
    }
}

// Inicialización
async function inicializarSeccionCalificaciones() {
    try {
        // Cargar datos iniciales
        await Promise.all([
            cargarEstudiantes(),
            cargarMaterias()
        ]);
        cargarPeriodos();
        await cargarCalificaciones();

        // Configurar el formulario
        const formCalificacion = document.getElementById('form-calificacion');
        if (formCalificacion) {
            formCalificacion.addEventListener('submit', agregarCalificacion);
        }

        // Configurar filtros
        const filtros = ['estudiante-select', 'periodo-select', 'materia-select'];
        filtros.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.addEventListener('change', cargarCalificaciones);
            }
        });

        const notaInput = document.getElementById('nota-input');
        if (notaInput) {
            notaInput.addEventListener('input', cargarCalificaciones);
        }
    } catch (error) {
        mostrarError('Error al inicializar la sección de calificaciones: ' + error.message);
    }
}

// Exportar función de inicialización
export { inicializarSeccionCalificaciones };
// Módulo para la interfaz de usuario de horarios
import { obtenerHorariosPorCurso, obtenerCursos } from './horarios.js';
import { mostrarError } from '../auth.js';

console.log('[Horarios UI] Iniciando módulo de interfaz de horarios...');

// Función para configurar los eventos del modal de horarios
function configurarModalHorario() {
    console.log('[Horarios UI] Configurando modal de horarios...');
    
    // Obtener referencias a los elementos del modal
    const btnNuevoHorario = document.querySelector('.btn-primary[data-action="nuevo-horario"]');
    const modalHorario = document.getElementById('modalHorario');
    const formHorario = document.getElementById('formHorario');
    
    if (btnNuevoHorario) {
        console.log('[Horarios UI] Configurando botón nuevo horario...');
        btnNuevoHorario.addEventListener('click', () => {
            const modal = new bootstrap.Modal(modalHorario);
            modal.show();
        });
    } else {
        console.warn('[Horarios UI] No se encontró el botón de nuevo horario');
    }
    
    if (formHorario) {
        console.log('[Horarios UI] Configurando formulario de horario...');
        formHorario.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarHorario();
        });
    } else {
        console.warn('[Horarios UI] No se encontró el formulario de horario');
    }
}

// Función para cargar la interfaz de horarios
export async function cargarHorariosUI(container) {
    console.log('[Horarios UI] Iniciando carga de horarios...');
    try {
        // Preparar la interfaz
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h5 class="mb-0">Horarios Escolares</h5>
                        </div>
                        <div class="col-md-6 d-flex justify-content-end">
                            <div class="input-group">
                                <label class="input-group-text" for="selectCurso">Curso:</label>
                                <select class="form-select" id="selectCurso">
                                    <option value="">Seleccione un curso...</option>
                                </select>
                                <button class="btn btn-primary ms-2" data-action="nuevo-horario">
                                    <i class="bi bi-plus"></i> Nuevo Horario
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="horarioContainer" class="mb-4" style="display: none;">
                        <h6 class="mb-3">Horario de Clases</h6>
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>Hora</th>
                                        <th>Lunes</th>
                                        <th>Martes</th>
                                        <th>Miércoles</th>
                                        <th>Jueves</th>
                                        <th>Viernes</th>
                                    </tr>
                                </thead>
                                <tbody id="tablaHorario"></tbody>
                            </table>
                        </div>
                    </div>
                    <div id="estudiantesContainer" class="mt-4" style="display: none;">
                        <h6 class="mb-3">Estudiantes del Curso</h6>
                        <div class="table-responsive">
                            <table class="table table-hover" id="tablaEstudiantes">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Apellido</th>
                                        <th>Grado</th>
                                        <th>Sección</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Obtener y cargar la lista de cursos
        const cursos = await obtenerCursos();
        console.log('[Horarios UI] Cursos obtenidos:', cursos);
        
        const selectCurso = document.getElementById('selectCurso');
        if (!selectCurso) {
            console.error('[Horarios UI] No se encontró el elemento selectCurso');
            return;
        }
        
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            selectCurso.appendChild(option);
        });
        
        // Configurar los eventos del modal
        configurarModalHorario();

        // Configurar evento de cambio de curso
        selectCurso.addEventListener('change', async () => {
            const curso = selectCurso.value;
            if (!curso) {
                document.getElementById('horarioContainer').style.display = 'none';
                document.getElementById('estudiantesContainer').style.display = 'none';
                return;
            }

            try {
                const { horario, horarioEscolar, estudiantes } = await obtenerHorariosPorCurso(curso);
                
                if (!horario) {
                    mostrarError('No se encontró el horario para este curso');
                    return;
                }

                // Mostrar horario
                mostrarHorario(horarioEscolar);
                
                // Mostrar lista de estudiantes
                mostrarEstudiantes(estudiantes);

            } catch (error) {
                console.error('[Horarios UI] Error al cargar horario:', error);
                mostrarError('Error al cargar el horario');
            }
        });

    } catch (error) {
        console.error('[Horarios UI] Error al cargar interfaz:', error);
        mostrarError('Error al cargar la interfaz de horarios');
    }
}

// Función para mostrar el horario en la tabla
function mostrarHorario(horarioEscolar) {
    console.log('[Horarios UI] Mostrando horario en la tabla:', horarioEscolar);
    
    const container = document.getElementById('horarioContainer');
    const tbody = document.getElementById('tablaHorario');
    if (!tbody) {
        console.error('[Horarios UI] No se encontró el elemento tablaHorario');
        return;
    }
    tbody.innerHTML = '';

    // Ordenar horario por hora de inicio y día
    const horarioPorHora = {};
    horarioEscolar.forEach(clase => {
        console.log('[Horarios UI] Procesando clase:', clase);
        const horaInicio = clase.hora_inicio;
        if (!horarioPorHora[horaInicio]) {
            horarioPorHora[horaInicio] = {
                lunes: '', martes: '', miercoles: '', jueves: '', viernes: ''
            };
        }

        const dia = obtenerDiaSemana(clase.dia_semana);
        
        horarioPorHora[horaInicio][dia] = `
            <div>
                <strong>${clase.materia || 'Sin materia'}</strong><br>
                <small>${clase.profesor || 'Sin profesor'}</small>
                <small class="d-block text-muted">
                    ${clase.nivel ? `Nivel: ${clase.nivel}<br>` : ''}
                    ${clase.turno ? `Turno: ${clase.turno}<br>` : ''}
                    ${clase.periodo ? `Periodo: ${clase.periodo}` : ''}
                </small>
            </div>
        `;
    });

    // Crear filas de la tabla
    Object.entries(horarioPorHora).forEach(([hora, clases]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="table-light">${formatearHora(hora)}</td>
            <td>${clases.lunes}</td>
            <td>${clases.martes}</td>
            <td>${clases.miercoles}</td>
            <td>${clases.jueves}</td>
            <td>${clases.viernes}</td>
        `;
        tbody.appendChild(tr);
    });

    container.style.display = 'block';
}

// Función para mostrar la lista de estudiantes
function mostrarEstudiantes(estudiantes) {
    const container = document.getElementById('estudiantesContainer');
    const tbody = document.querySelector('#tablaEstudiantes tbody');
    tbody.innerHTML = '';

    estudiantes.forEach(estudiante => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${estudiante.codigo_estudiante}</td>
            <td>${estudiante.personas?.nombre || ''}</td>
            <td>${estudiante.personas?.apellido || ''}</td>
            <td>${estudiante.grado}</td>
            <td>${estudiante.seccion}</td>
        `;
        tbody.appendChild(tr);
    });

    // Inicializar DataTable
    if ($.fn.DataTable.isDataTable('#tablaEstudiantes')) {
        $('#tablaEstudiantes').DataTable().destroy();
    }

    $('#tablaEstudiantes').DataTable({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        responsive: true,
        order: [[1, 'asc']] // Ordenar por nombre
    });

    container.style.display = 'block';
}

// Función auxiliar para obtener el nombre del día
function obtenerDiaSemana(dia) {
    console.log('[Horarios UI] Procesando día de la semana:', dia);
    const dias = {
        'Lunes': 'lunes',
        'Martes': 'martes',
        'Miércoles': 'miercoles',
        'Miercoles': 'miercoles',
        'Jueves': 'jueves',
        'Viernes': 'viernes',
        'LUNES': 'lunes',
        'MARTES': 'martes',
        'MIÉRCOLES': 'miercoles',
        'MIERCOLES': 'miercoles',
        'JUEVES': 'jueves',
        'VIERNES': 'viernes'
    };
    const diaFormateado = dias[dia];
    if (!diaFormateado) {
        console.warn('[Horarios UI] Día no reconocido:', dia);
    }
    return diaFormateado || '';
}

// Función auxiliar para formatear hora
function formatearHora(hora) {
    return hora.slice(0, 5); // Mostrar solo HH:MM
}
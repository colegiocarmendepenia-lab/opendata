// Funciones auxiliares para manejar calificaciones

// Función para llenar un select con opciones
function llenarSelect(selectId, datos, campoNombre) {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">Seleccione...</option>`;
    datos.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${item[campoNombre]}</option>`;
    });
}

// Función para formatear una calificación
function formatearCalificacion(nota) {
    if (nota >= 6) return `<span class="text-success fw-bold">${nota.toFixed(1)}</span>`;
    if (nota >= 4) return `<span class="text-warning fw-bold">${nota.toFixed(1)}</span>`;
    return `<span class="text-danger fw-bold">${nota.toFixed(1)}</span>`;
}

// Función para mostrar el modal de calificación
async function mostrarModalCalificacion(calificacionId = null) {
    const modal = new bootstrap.Modal(document.getElementById('modalCalificacion'));
    const form = document.getElementById('formCalificacion');

    try {
        // Cargar datos necesarios
        const [cursos, materias, evaluaciones] = await Promise.all([
            supabase.from('cursos').select('*').order('nombre'),
            supabase.from('materias').select('*').order('nombre'),
            supabase.from('evaluaciones').select('*').order('fecha')
        ]);

        // Llenar selects
        llenarSelect('asignaturaCalificacion', asignaturas.data, 'nombre');
        llenarSelect('evaluacion', evaluaciones.data, 'nombre');

        // Configurar evento de cambio de curso
        document.getElementById('cursoCalificacion')?.addEventListener('change', async function() {
            if (this.value) {
                const { data: alumnos } = await supabase
                    .from('estudiantes')
                    .select('*')
                    .eq('curso_id', this.value)
                    .order('apellido');

                llenarSelect('alumnoCalificacion', alumnos, 'nombre');
            }
        });

        // Si es edición, cargar datos
        if (calificacionId) {
            const { data: calificacion } = await supabase
                .from('calificaciones')
                .select('*')
                .eq('id', calificacionId)
                .single();

            if (calificacion) {
                document.getElementById('calificacionId').value = calificacion.id;
                document.getElementById('alumnoCalificacion').value = calificacion.alumno_id;
                document.getElementById('asignaturaCalificacion').value = calificacion.asignatura_id;
                document.getElementById('evaluacion').value = calificacion.evaluacion_id;
                document.getElementById('nota').value = calificacion.nota;
                document.getElementById('fechaCalificacion').value = formatearFecha(calificacion.fecha);
                document.getElementById('observacionCalificacion').value = calificacion.observacion || '';
            }
        } else {
            form.reset();
            document.getElementById('fechaCalificacion').value = new Date().toISOString().split('T')[0];
        }

        modal.show();
    } catch (error) {
        console.error('Error al preparar modal de calificación:', error);
        mostrarError('Error al cargar los datos necesarios');
    }
}

// Función para guardar una calificación
async function guardarCalificacion() {
    try {
        const form = document.getElementById('formCalificacion');
        if (!validarFormularioCalificacion(form)) return;

        const calificacion = {
            alumno_id: form.alumnoCalificacion.value,
            asignatura_id: form.asignaturaCalificacion.value,
            evaluacion_id: form.evaluacion.value,
            nota: parseFloat(form.nota.value),
            fecha: form.fechaCalificacion.value,
            observacion: form.observacionCalificacion.value,
            updated_at: new Date().toISOString()
        };

        const id = form.calificacionId.value;

        if (id) {
            // Actualizar
            const { error } = await supabase
                .from('calificaciones')
                .update(calificacion)
                .eq('id', id);

            if (error) throw error;
            mostrarExito('Calificación actualizada correctamente');
        } else {
            // Crear nuevo
            const { error } = await supabase
                .from('calificaciones')
                .insert([calificacion]);

            if (error) throw error;
            mostrarExito('Calificación registrada correctamente');
        }

        bootstrap.Modal.getInstance(document.getElementById('modalCalificacion')).hide();
        cargarSeccion('calificaciones');

    } catch (error) {
        console.error('Error al guardar calificación:', error);
        mostrarError('Error al guardar la calificación');
    }
}

// Función para validar el formulario de calificación
function validarFormularioCalificacion(form) {
    let valido = true;

    // Validar campos requeridos
    ['alumnoCalificacion', 'asignaturaCalificacion', 'evaluacion', 'nota', 'fechaCalificacion'].forEach(campo => {
        const elemento = form[campo];
        if (!elemento.value) {
            elemento.classList.add('is-invalid');
            valido = false;
        } else {
            elemento.classList.remove('is-invalid');
        }
    });

    // Validar rango de nota
    const nota = parseFloat(form.nota.value);
    if (isNaN(nota) || nota < 1.0 || nota > 7.0) {
        form.nota.classList.add('is-invalid');
        valido = false;
    }

    return valido;
}

// Función para filtrar calificaciones
async function filtrarCalificaciones(tabla) {
    const curso = document.getElementById('filtroCurso').value;
    const asignatura = document.getElementById('filtroAsignatura').value;
    const evaluacion = document.getElementById('filtroEvaluacion').value;

    let query = supabase
        .from('calificaciones')
        .select(`
            *,
            alumno:alumno_id(nombre, apellido, curso_id),
            asignatura:asignatura_id(nombre),
            evaluacion:evaluacion_id(nombre)
        `);

    if (curso) query = query.eq('alumno.curso_id', curso);
    if (asignatura) query = query.eq('asignatura_id', asignatura);
    if (evaluacion) query = query.eq('evaluacion_id', evaluacion);

    try {
        const { data, error } = await query;
        if (error) throw error;

        tabla.clear().rows.add(data.map(c => ({
            fecha: formatearFecha(c.fecha),
            alumno: `${c.alumno.apellido}, ${c.alumno.nombre}`,
            asignatura: c.asignatura.nombre,
            evaluacion: c.evaluacion.nombre,
            nota: formatearCalificacion(c.nota),
            observacion: c.observacion || '',
            acciones: `
                <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${c.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${c.id}">
                    <i class="bi bi-trash"></i>
                </button>
            `
        }))).draw();

    } catch (error) {
        console.error('Error al filtrar calificaciones:', error);
        mostrarError('Error al aplicar los filtros');
    }
}

// Función para generar reporte de calificaciones
async function generarReporteCalificaciones() {
    try {
        const { data: calificaciones, error } = await supabase
            .from('calificaciones')
            .select(`
                *,
                alumno:alumno_id(nombre, apellido, curso_id),
                curso:alumno.curso_id(nombre),
                asignatura:asignatura_id(nombre),
                evaluacion:evaluacion_id(nombre)
            `)
            .order('fecha', { ascending: false });

        if (error) throw error;

        // Agrupar por curso y asignatura
        const reporte = {};
        calificaciones.forEach(c => {
            const cursoNombre = c.curso.nombre;
            if (!reporte[cursoNombre]) {
                reporte[cursoNombre] = {};
            }
            if (!reporte[cursoNombre][c.asignatura.nombre]) {
                reporte[cursoNombre][c.asignatura.nombre] = [];
            }
            reporte[cursoNombre][c.asignatura.nombre].push({
                alumno: `${c.alumno.apellido}, ${c.alumno.nombre}`,
                nota: c.nota,
                evaluacion: c.evaluacion.nombre,
                fecha: formatearFecha(c.fecha)
            });
        });

        // Generar HTML del reporte
        let reporteHTML = `
            <style>
                .tabla-reporte { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
                .tabla-reporte th, .tabla-reporte td { border: 1px solid #dee2e6; padding: 0.5rem; }
                .tabla-reporte th { background-color: #f8f9fa; }
                .promedio { font-weight: bold; }
            </style>
            <h2>Reporte de Calificaciones</h2>
            <p>Generado el: ${new Date().toLocaleDateString()}</p>
        `;

        for (const curso in reporte) {
            reporteHTML += `<h3>Curso: ${curso}</h3>`;
            for (const asignatura in reporte[curso]) {
                const notas = reporte[curso][asignatura];
                const promedio = notas.reduce((a, b) => a + b.nota, 0) / notas.length;

                reporteHTML += `
                    <h4>Asignatura: ${asignatura} - Promedio: ${promedio.toFixed(1)}</h4>
                    <table class="tabla-reporte">
                        <thead>
                            <tr>
                                <th>Alumno</th>
                                <th>Evaluación</th>
                                <th>Nota</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${notas.map(n => `
                                <tr>
                                    <td>${n.alumno}</td>
                                    <td>${n.evaluacion}</td>
                                    <td>${n.nota.toFixed(1)}</td>
                                    <td>${n.fecha}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        }

        // Crear ventana de impresión
        const ventanaImpresion = window.open('', '_blank');
        ventanaImpresion.document.write(reporteHTML);
        ventanaImpresion.document.close();
        ventanaImpresion.print();

    } catch (error) {
        console.error('Error al generar reporte:', error);
        mostrarError('Error al generar el reporte de calificaciones');
    }
}
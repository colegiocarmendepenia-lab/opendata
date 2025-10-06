// Funciones auxiliares para manejar asistencias

// Función para formatear el estado de asistencia
function formatearEstadoAsistencia(estado) {
    const estados = {
        presente: '<span class="badge bg-success">Presente</span>',
        ausente: '<span class="badge bg-danger">Ausente</span>',
        justificado: '<span class="badge bg-warning">Justificado</span>',
        atraso: '<span class="badge bg-info">Atraso</span>'
    };
    return estados[estado] || estado;
}

// Función para mostrar el modal de asistencia
async function mostrarModalAsistencia() {
    const modal = new bootstrap.Modal(document.getElementById('modalAsistencia'));
    
    try {
        // Cargar cursos
        const { data: cursos } = await supabase
            .from('cursos')
            .select('*')
            .order('nombre');

        // Llenar select de cursos
        const selectCurso = document.getElementById('cursoAsistencia');
        selectCurso.innerHTML = '<option value="">Seleccione curso...</option>';
        cursos.forEach(curso => {
            selectCurso.innerHTML += `<option value="${curso.id}">${curso.nombre}</option>`;
        });

        // Evento de cambio de curso
        selectCurso.addEventListener('change', async function() {
            if (this.value) {
                await cargarAlumnosCurso(this.value);
            }
        });

        // Establecer fecha actual
        document.getElementById('fechaAsistencia').value = new Date().toISOString().split('T')[0];

        modal.show();
    } catch (error) {
        console.error('Error al preparar modal de asistencia:', error);
        mostrarError('Error al cargar los datos necesarios');
    }
}

// Función para cargar alumnos de un curso
async function cargarAlumnosCurso(cursoId) {
    try {
        const { data: alumnos } = await supabase
            .from('alumnos')
            .select('*')
            .eq('curso_id', cursoId)
            .order('apellido');

        // Llenar tabla de asistencia
        const tbody = document.querySelector('#tablaAsistencia tbody');
        tbody.innerHTML = alumnos.map(alumno => `
            <tr>
                <td>${alumno.apellido}, ${alumno.nombre}</td>
                <td>
                    <select class="form-select form-select-sm estado-asistencia" data-alumno="${alumno.id}">
                        <option value="presente">Presente</option>
                        <option value="ausente">Ausente</option>
                        <option value="justificado">Justificado</option>
                        <option value="atraso">Atraso</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm observacion-asistencia" 
                           data-alumno="${alumno.id}" placeholder="Observación">
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar alumnos:', error);
        mostrarError('Error al cargar la lista de alumnos');
    }
}

// Función para guardar asistencias
async function guardarAsistencias() {
    try {
        const fecha = document.getElementById('fechaAsistencia').value;
        const asistencias = [];

        // Recolectar datos de la tabla
        document.querySelectorAll('#tablaAsistencia tbody tr').forEach(tr => {
            const alumnoId = tr.querySelector('.estado-asistencia').dataset.alumno;
            const estado = tr.querySelector('.estado-asistencia').value;
            const observacion = tr.querySelector('.observacion-asistencia').value;

            asistencias.push({
                alumno_id: alumnoId,
                fecha,
                estado,
                observacion,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        });

        // Guardar en la base de datos
        const { error } = await supabase
            .from('asistencias')
            .insert(asistencias);

        if (error) throw error;

        mostrarExito('Asistencias registradas correctamente');
        bootstrap.Modal.getInstance(document.getElementById('modalAsistencia')).hide();
        cargarSeccion('asistencias');

    } catch (error) {
        console.error('Error al guardar asistencias:', error);
        mostrarError('Error al guardar las asistencias');
    }
}

// Función para editar una asistencia
async function editarAsistencia(id) {
    try {
        const { data: asistencia, error } = await supabase
            .from('asistencias')
            .select('*, alumno:alumno_id(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        Swal.fire({
            title: 'Editar Asistencia',
            html: `
                <div class="mb-3">
                    <label class="form-label">Alumno</label>
                    <input type="text" class="form-control" value="${asistencia.alumno.nombre} ${asistencia.alumno.apellido}" disabled>
                </div>
                <div class="mb-3">
                    <label class="form-label">Estado</label>
                    <select class="form-select" id="editEstado">
                        ${['presente', 'ausente', 'justificado', 'atraso'].map(estado => 
                            `<option value="${estado}" ${estado === asistencia.estado ? 'selected' : ''}>
                                ${estado.charAt(0).toUpperCase() + estado.slice(1)}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Observación</label>
                    <textarea class="form-control" id="editObservacion">${asistencia.observacion || ''}</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    estado: document.getElementById('editEstado').value,
                    observacion: document.getElementById('editObservacion').value
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { error: updateError } = await supabase
                    .from('asistencias')
                    .update({
                        estado: result.value.estado,
                        observacion: result.value.observacion,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (updateError) throw updateError;

                mostrarExito('Asistencia actualizada correctamente');
                cargarSeccion('asistencias');
            }
        });

    } catch (error) {
        console.error('Error al editar asistencia:', error);
        mostrarError('Error al editar la asistencia');
    }
}

// Función para eliminar una asistencia
async function eliminarAsistencia(id) {
    try {
        const confirmacion = await Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
            const { error } = await supabase
                .from('asistencias')
                .delete()
                .eq('id', id);

            if (error) throw error;

            mostrarExito('Asistencia eliminada correctamente');
            cargarSeccion('asistencias');
        }

    } catch (error) {
        console.error('Error al eliminar asistencia:', error);
        mostrarError('Error al eliminar la asistencia');
    }
}
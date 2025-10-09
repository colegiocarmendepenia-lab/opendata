// Funciones de utilidad

// Llenar select con opciones
export function llenarSelect(selectElement, opciones, valorKey = 'id', textoKey = 'nombre') {
    selectElement.innerHTML = '<option value="">Seleccione...</option>';
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = typeof valorKey === 'function' ? valorKey(opcion) : opcion[valorKey];
        option.textContent = typeof textoKey === 'function' ? textoKey(opcion) : opcion[textoKey];
        selectElement.appendChild(option);
    });
}

// Formatear fecha para inputs
export function formatearFecha(fecha) {
    return fecha ? new Date(fecha).toISOString().split('T')[0] : '';
}

// Formatear fecha y hora para inputs
export function formatearFechaHora(fecha) {
    return fecha ? new Date(fecha).toISOString().slice(0, 16) : '';
}

// Validar campos requeridos
export function validarCamposRequeridos(formulario) {
    let valido = true;
    formulario.querySelectorAll('[required]').forEach(campo => {
        if (!campo.value) {
            campo.classList.add('is-invalid');
            valido = false;
        } else {
            campo.classList.remove('is-invalid');
        }
    });
    return valido;
}

// Limpiar formulario
export function limpiarFormulario(formulario) {
    formulario.reset();
    formulario.querySelectorAll('.is-invalid').forEach(campo => {
        campo.classList.remove('is-invalid');
    });
}

// Mostrar mensaje de error
export function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        timer: 3000
    });
}

// Mostrar mensaje de éxito
export function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        timer: 2000
    });
}

// Confirmar acción
export async function confirmar(mensaje) {
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: mensaje,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed;
}

// Formatear estado de asistencia
export function formatearEstadoAsistencia(estado) {
    const estados = {
        presente: '<span class="badge bg-success">Presente</span>',
        ausente: '<span class="badge bg-danger">Ausente</span>',
        justificado: '<span class="badge bg-warning">Justificado</span>',
        atraso: '<span class="badge bg-info">Atraso</span>'
    };
    return estados[estado] || estado;
}

// Formatear calificación
export function formatearCalificacion(nota) {
    if (nota >= 6) return `<span class="text-success fw-bold">${nota}</span>`;
    if (nota >= 4) return `<span class="text-warning fw-bold">${nota}</span>`;
    return `<span class="text-danger fw-bold">${nota}</span>`;
}
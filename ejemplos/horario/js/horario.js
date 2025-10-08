// Variables globales
let horarioData = [];
let cursoActual = null;

// Función para obtener parámetros de la URL
function obtenerParametroURL(nombre) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre);
}

// Función para cargar los datos desde la base de datos
async function cargarDatos() {
    try {
        // Obtener el curso de la URL
        cursoActual = obtenerParametroURL('curso');
        
        let query = supabase
            .from('horario')
            .select('*')
            .order('id', { ascending: true });
            
        // Si hay un curso específico, filtrar por él
        if (cursoActual) {
            query = query.eq('curso', cursoActual);
        }

        const response = await query;
        if (response.error) throw response.error;
        
        horarioData = response.data;
        
        // Actualizar el título con el curso actual
        if (cursoActual) {
            const subtitleElement = document.getElementById('curso-nivel');
            if (subtitleElement) {
                const primerRegistro = horarioData[0] || {};
                subtitleElement.textContent = `${cursoActual} - ${primerRegistro.nivel || ''}`;
            }
        }
        
        generarHorario();
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar los datos del horario');
    }
}

// Función para formatear la hora
function formatearHora(hora) {
    return hora.substring(0, 5);
}

// Función para mostrar mensajes de error
function mostrarError(mensaje) {
    const scheduleContent = document.getElementById('schedule-content');
    scheduleContent.innerHTML = `
        <div class="error-message">
            <p>${mensaje}</p>
            <button onclick="cargarDatos()" class="btn-primary">Reintentar</button>
        </div>
    `;
}

// Función para generar el horario
function generarHorario(turnoFiltro = 'all', diaFiltro = 'all') {
    const scheduleContent = document.getElementById('schedule-content');
    scheduleContent.innerHTML = '';
    
    // Filtrar datos
    let datosFiltrados = horarioData;
    if (turnoFiltro !== 'all') {
        datosFiltrados = datosFiltrados.filter(item => item.turno === turnoFiltro);
    }
    if (diaFiltro !== 'all') {
        datosFiltrados = datosFiltrados.filter(item => item.dia_semana === diaFiltro);
    }
    
    if (datosFiltrados.length === 0) {
        scheduleContent.innerHTML = '<p style="text-align: center; padding: 20px;">No hay datos para mostrar con los filtros seleccionados.</p>';
        return;
    }
    
    // Agrupar por turno
    const turnos = [...new Set(datosFiltrados.map(item => item.turno))];
    
    turnos.forEach(turno => {
        const datosTurno = datosFiltrados.filter(item => item.turno === turno);
        
        // Crear tabla para el turno
        const tabla = document.createElement('table');
        
        // Crear encabezado
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Celda vacía para la esquina
        const emptyHeader = document.createElement('th');
        emptyHeader.textContent = 'Hora / Día';
        headerRow.appendChild(emptyHeader);
        
        // Obtener días únicos para este turno
        const dias = [...new Set(datosTurno.map(item => item.dia_semana))];
        
        // Ordenar días de la semana
        const ordenDias = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
        dias.sort((a, b) => ordenDias.indexOf(a) - ordenDias.indexOf(b));
        
        // Crear encabezados de días
        dias.forEach(dia => {
            const th = document.createElement('th');
            th.textContent = dia;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        tabla.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        // Obtener horas únicas para este turno
        const horas = [...new Set(datosTurno.map(item => item.hora_inicio))];
        horas.sort();
        
        // Crear filas para cada hora
        horas.forEach(hora => {
            const row = document.createElement('tr');
            
            // Celda de hora
            const horaCell = document.createElement('td');
            horaCell.className = 'time-cell';
            horaCell.textContent = formatearHora(hora);
            row.appendChild(horaCell);
            
            // Celdas para cada día
            dias.forEach(dia => {
                const clase = datosTurno.find(item => 
                    item.dia_semana === dia && item.hora_inicio === hora
                );
                
                const cell = document.createElement('td');
                cell.className = 'class-cell';
                
                if (clase) {
                    cell.innerHTML = `
                        <div class="materia">${clase.materia || 'Sin asignar'}</div>
                        <div class="profesor">${clase.profesor || 'Sin asignar'}</div>
                        <div class="periodo">${clase.periodo}</div>
                    `;
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        tabla.appendChild(tbody);
        
        // Crear contenedor para la tabla con el badge del turno
        const turnoContainer = document.createElement('div');
        turnoContainer.style.marginBottom = '30px';
        
        const turnoBadge = document.createElement('div');
        turnoBadge.className = `turno-badge ${turno === 'T.T.' ? 'tt-badge' : 'tm-badge'}`;
        turnoBadge.textContent = turno === 'T.T.' ? 'TURNO TARDE' : 'TURNO MAÑANA';
        
        turnoContainer.appendChild(turnoBadge);
        turnoContainer.appendChild(tabla);
        
        scheduleContent.appendChild(turnoContainer);
    });
}

// Función para imprimir el reporte
function imprimirReporte() {
    window.print();
}

// Función para exportar a Excel
function exportarExcel() {
    // Preparar datos para Excel
    const datosExcel = horarioData.map(item => ({
        'Nivel': item.nivel,
        'Turno': item.turno,
        'Curso': item.curso,
        'Día': item.dia_semana,
        'Hora Inicio': formatearHora(item.hora_inicio),
        'Hora Fin': formatearHora(item.hora_fin),
        'Período': item.periodo,
        'Materia': item.materia || 'Sin asignar',
        'Profesor': item.profesor || 'Sin asignar'
    }));
    
    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Añadir hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Horario Escolar');
    
    // Generar nombre del archivo con fecha
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    const nombreArchivo = `horario_escolar_${fecha}.xlsx`;
    
    // Exportar a Excel
    XLSX.writeFile(wb, nombreArchivo);
}

// Función para exportar a PDF
async function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Formato landscape para mejor visualización
    
    try {
        // Capturar el contenido HTML como imagen
        const canvas = await html2canvas(document.querySelector('.container'), {
            scale: 2, // Mayor calidad
            useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20; // Margen de 10mm en cada lado
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Añadir la imagen al PDF
        doc.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
        
        // Generar nombre del archivo con fecha
        const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
        const nombreArchivo = `horario_escolar_${fecha}.pdf`;
        
        // Guardar PDF
        doc.save(nombreArchivo);
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha actual
    const ahora = new Date();
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('fecha-actual').textContent = 
        ahora.toLocaleDateString('es-ES', opciones);
    
    // Cargar datos iniciales
    cargarDatos();
    
    // Configurar eventos de filtros
    document.getElementById('turnoFilter').addEventListener('change', function() {
        const turno = this.value;
        const dia = document.getElementById('diaFilter').value;
        generarHorario(turno, dia);
    });
    
    document.getElementById('diaFilter').addEventListener('change', function() {
        const dia = this.value;
        const turno = document.getElementById('turnoFilter').value;
        generarHorario(turno, dia);
    });
});
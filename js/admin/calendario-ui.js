// Módulo para la interfaz de usuario del calendario
console.log('[Calendario UI] Iniciando módulo...');

import { obtenerEventos, crearEvento, actualizarEvento, eliminarEvento, validarEvento } from './calendario-escolar.js';
import { mostrarError, mostrarExito } from '../auth.js';

console.log('[Calendario UI] Imports completados');

// Variable global para el calendario
let calendario = null;

// Función para cargar eventos en el calendario
export async function cargarEventosCalendario(container) {
    console.log('[Calendario UI] Iniciando carga de calendario...');
    try {
        console.log('[Calendario UI] Verificando dependencias:', {
            FullCalendar: window.FullCalendar ? 'Cargado' : 'No cargado',
            jQuery: window.jQuery ? 'Cargado' : 'No cargado',
            bootstrap: window.bootstrap ? 'Cargado' : 'No cargado'
        });
        // Preparar la interfaz
        container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Calendario Escolar</h5>
                    <button class="btn btn-primary" id="btnNuevoEvento">
                        <i class="bi bi-plus-circle"></i> Nuevo Evento
                    </button>
                </div>
                <div class="card-body">
                    <div id="calendario"></div>
                </div>
            </div>
        `;

        // Cargar eventos
        console.log('[Calendario UI] Obteniendo eventos...');
        const eventos = await obtenerEventos();
        console.log('[Calendario UI] Eventos obtenidos:', eventos);

        // Formatear eventos para el calendario
        const eventosCalendario = eventos.map(evento => ({
            id: evento.id,
            title: evento.descripcion,
            start: evento.fecha,
            end: evento.fecha,
            allDay: true,
            className: obtenerClaseEvento(evento.tipo_evento),
            extendedProps: {
                tipo: evento.tipo_evento
            }
        }));

        // Inicializar calendario
        console.log('[Calendario UI] Preparando inicialización del calendario...');
        const calendarEl = document.getElementById('calendario');
        if (!calendarEl) {
            console.error('[Calendario UI] Elemento del calendario no encontrado');
            throw new Error('Elemento del calendario no encontrado');
        }
        console.log('[Calendario UI] Elemento del calendario encontrado:', calendarEl);
        calendario = new window.FullCalendar.Calendar(calendarEl, {
            plugins: [
                window.FullCalendarDayGrid,
                window.FullCalendarTimeGrid,
                window.FullCalendarInteraction
            ],
            initialView: 'dayGridMonth',
            initialView: 'dayGridMonth',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: eventosCalendario,
            editable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            select: function(info) {
                mostrarModalEvento({
                    fecha: info.start,
                    modo: 'crear'
                });
            },
            eventClick: function(info) {
                mostrarModalEvento({
                    id: info.event.id,
                    descripcion: info.event.title,
                    fecha: info.event.start,
                    tipo_evento: info.event.extendedProps.tipo,
                    modo: 'editar'
                });
            },
            eventDrop: async function(info) {
                try {
                    await actualizarEvento(info.event.id, {
                        descripcion: info.event.title,
                        fecha: info.event.start,
                        tipo_evento: info.event.extendedProps.tipo
                    });
                } catch (error) {
                    info.revert();
                }
            }
        });

        calendario.render();

        // Configurar eventos de botones
        document.getElementById('btnNuevoEvento').addEventListener('click', () => {
            mostrarModalEvento({
                fecha: new Date(),
                modo: 'crear'
            });
        });

    } catch (error) {
        console.error('Error al cargar calendario:', error);
        mostrarError('Error al cargar el calendario');
    }
}

// Función para mostrar el modal de evento
function mostrarModalEvento(datos) {
    const modal = new bootstrap.Modal(document.getElementById('modalEvento'));
    const form = document.getElementById('formEvento');
    const titulo = document.getElementById('modalEventoLabel');
    
    // Configurar título del modal
    titulo.textContent = datos.modo === 'crear' ? 'Nuevo Evento' : 'Editar Evento';
    
    // Llenar formulario
    form.eventoId.value = datos.id || '';
    form.eventoTitulo.value = datos.descripcion || '';
    form.tipoEvento.value = datos.tipo_evento || 'actividad';
    form.eventoFecha.value = formatearFecha(datos.fecha, false);
    
    // Mostrar/ocultar botón eliminar
    document.getElementById('btnEliminarEvento').style.display = 
        datos.modo === 'editar' ? 'block' : 'none';
    
    // Configurar eventos del modal
    form.onsubmit = async (e) => {
        e.preventDefault();
        await guardarEvento();
    };

    document.getElementById('btnEliminarEvento').onclick = async () => {
        if (confirm('¿Está seguro de eliminar este evento?')) {
            await eliminarEventoCalendario(datos.id);
        }
    };
    
    modal.show();
}

// Función para guardar evento desde el formulario
async function guardarEvento() {
    try {
        const form = document.getElementById('formEvento');
        const evento = {
            descripcion: form.eventoTitulo.value.trim(),
            fecha: form.eventoFecha.value,
            tipo_evento: form.tipoEvento.value
        };

        // Validar evento
        const errores = validarEvento(evento);
        if (errores.length > 0) {
            throw new Error(errores.join('\n'));
        }

        if (form.eventoId.value) {
            // Actualizar evento existente
            await actualizarEvento(form.eventoId.value, evento);
        } else {
            // Crear nuevo evento
            await crearEvento(evento);
        }

        // Cerrar modal y recargar calendario
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEvento'));
        modal.hide();
        calendario.refetchEvents();

    } catch (error) {
        console.error('Error al guardar evento:', error);
        mostrarError(error.message);
    }
}

// Función para eliminar evento
async function eliminarEventoCalendario(id) {
    try {
        await eliminarEvento(id);
        
        // Cerrar modal y recargar calendario
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEvento'));
        modal.hide();
        calendario.refetchEvents();

    } catch (error) {
        console.error('Error al eliminar evento:', error);
        mostrarError(error.message);
    }
}

// Función para obtener la clase CSS según el tipo de evento
function obtenerClaseEvento(tipo) {
    switch (tipo) {
        case 'clase':
            return 'bg-primary';
        case 'evaluacion':
            return 'bg-danger';
        case 'reunion':
            return 'bg-info';
        case 'actividad':
            return 'bg-success';
        case 'feriado':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

// Función para formatear fecha
function formatearFecha(fecha, incluirHora = true) {
    if (!fecha) return '';
    const f = new Date(fecha);
    return incluirHora ? 
        f.toISOString().slice(0, 16) : // Con hora (YYYY-MM-DDTHH:mm)
        f.toISOString().slice(0, 10);  // Solo fecha (YYYY-MM-DD)
}
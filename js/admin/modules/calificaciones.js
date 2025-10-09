// Módulo de calificaciones
import { supabase } from '../supabase.js';

export async function cargarCalificaciones(container) {
    try {
        // Preparar la interfaz
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Calificaciones</h5>
                </div>
                <div class="card-body">
                    <!-- Tabla de calificaciones -->
                    <div class="table-responsive">
                        <table class="table table-striped table-hover" id="tablaCalificaciones">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Estudiante</th>
                                    <th>Periodo</th>
                                    <th>Materia</th>
                                    <th>Nota</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="5" class="text-center">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Cargando...</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Cargar datos de calificaciones
        const { data: calificaciones, error } = await supabase
            .from('calificaciones')
            .select(`
                *,
                persona:estudiante_id(nombre, apellido)
            `)
            .order('fecha_registro', { ascending: false });

        if (error) throw error;

        // Configurar DataTable
        new DataTable('#tablaCalificaciones', {
            data: calificaciones.map(c => ({
                fecha: new Date(c.fecha_registro).toLocaleDateString(),
                estudiante: c.persona ? `${c.persona.apellido}, ${c.persona.nombre}` : 'No asignado',
                periodo: c.periodo,
                materia: c.materia,
                nota: formatearNota(c.nota)
            })),
            columns: [
                { data: 'fecha' },
                { data: 'estudiante' },
                { data: 'periodo' },
                { data: 'materia' },
                { data: 'nota' }
            ],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json'
            },
            order: [[0, 'desc']],
            pageLength: 10,
            responsive: true
        });

    } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill"></i> Error al cargar las calificaciones
            </div>
        `;
    }
}

// Función auxiliar para formatear notas
function formatearNota(nota) {
    if (typeof nota !== 'number') return '--';
    return `<span class="badge ${nota >= 40 ? 'bg-success' : 'bg-danger'}">${nota}</span>`;
}
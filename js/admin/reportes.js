// Gestión de reportes
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar reportes al mostrar la sección
    document.querySelector('.nav-link[data-section="reportes"]').addEventListener('click', () => {
        cargarReportes();
    });

    // Event listener para generar reporte
    document.getElementById('btnGenerarReporte').addEventListener('click', generarReporte);
});

// Función para cargar reportes
async function cargarReportes() {
    try {
        // Obtener estadísticas
        const stats = await obtenerEstadisticas();
        
        // Actualizar la sección de reportes
        const reportesSection = document.getElementById('reportesSection');
        reportesSection.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Estadísticas de Uso</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="usageChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Distribución de Usuarios</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="userChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-12 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Datasets más Populares</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Dataset</th>
                                            <th>Categoría</th>
                                            <th>Descargas</th>
                                            <th>Última Descarga</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${stats.popularDatasets.map(dataset => `
                                            <tr>
                                                <td>${dataset.nombre}</td>
                                                <td>${dataset.categoria}</td>
                                                <td>${dataset.downloads}</td>
                                                <td>${new Date(dataset.last_download).toLocaleDateString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Crear gráficos
        crearGraficos(stats);

    } catch (error) {
        console.error('Error al cargar reportes:', error.message);
        mostrarError('Error al cargar los reportes');
    }
}

// Función para obtener estadísticas
async function obtenerEstadisticas() {
    try {
        // Estadísticas de usuarios por rol usando RPC
        const { data: userStats, error: userError } = await supabase
            .rpc('get_user_stats');

        if (userError) throw userError;

        // Datasets más populares
        const { data: popularDatasets, error: datasetError } = await supabase
            .from('datasets_con_relaciones')
            .select('*')
            .order('downloads', { ascending: false })
            .limit(5);

        if (datasetError) throw datasetError;

        // Actividad por día (últimos 7 días)
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        
        const { data: activityStats, error: activityError } = await supabase
            .from('actividad_con_relaciones')
            .select('*')
            .gte('created_at', fechaInicio.toISOString());

        if (activityError) throw activityError;

        return {
            userStats,
            popularDatasets,
            activityStats
        };

    } catch (error) {
        console.error('Error al obtener estadísticas:', error.message);
        throw error;
    }
}

// Función para crear gráficos
function crearGraficos(stats) {
    // Gráfico de uso
    const usageCtx = document.getElementById('usageChart').getContext('2d');
    new Chart(usageCtx, {
        type: 'line',
        data: {
            labels: getLast7Days(),
            datasets: [{
                label: 'Actividad Diaria',
                data: getActivityData(stats.activityStats),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gráfico de usuarios
    const userCtx = document.getElementById('userChart').getContext('2d');
    new Chart(userCtx, {
        type: 'pie',
        data: {
            labels: stats.userStats.map(stat => stat.rol),
            datasets: [{
                data: stats.userStats.map(stat => stat.count),
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 205, 86)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Función para generar reporte PDF
async function generarReporte() {
    try {
        // Implementar generación de PDF
        alert('Función de generación de reportes en desarrollo');
    } catch (error) {
        console.error('Error al generar reporte:', error.message);
        mostrarError('Error al generar el reporte');
    }
}

// Funciones auxiliares
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString());
    }
    return days;
}

function getActivityData(activityStats) {
    const days = getLast7Days();
    const data = new Array(7).fill(0);

    activityStats.forEach(activity => {
        const date = new Date(activity.created_at).toLocaleDateString();
        const index = days.indexOf(date);
        if (index !== -1) {
            data[index]++;
        }
    });

    return data;
}
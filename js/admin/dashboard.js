import auth, { supabase, mostrarError, mostrarExito } from './auth.js';

// Variables globales
let activityChart = null;

// Función para cargar estadísticas
async function loadStats() {
    try {
        // Total de usuarios
        const { count: userCount, error: userError } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true });

        if (userError) throw userError;
        document.getElementById('totalUsuarios').textContent = userCount;

        // Total de datasets
        const { count: datasetCount, error: datasetError } = await supabase
            .from('datasets')
            .select('*', { count: 'exact', head: true });

        if (datasetError) throw datasetError;
        document.getElementById('totalDatasets').textContent = datasetCount;

        // Total de descargas
        const { count: downloadCount, error: downloadError } = await supabase
            .from('descargas')
            .select('*', { count: 'exact', head: true });

        if (downloadError) throw downloadError;
        document.getElementById('totalDescargas').textContent = downloadCount;

        // Actividad en las últimas 24 horas
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: activityCount, error: activityError } = await supabase
            .from('actividad')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneDayAgo);

        if (activityError) throw activityError;
        document.getElementById('totalActividad').textContent = activityCount;

    } catch (error) {
        console.error('Error al cargar estadísticas:', error.message);
        mostrarError('Error al cargar las estadísticas');
    }
}

// Función para cargar actividad reciente
async function loadRecentActivity() {
    try {
        const { data, error } = await supabase
            .from('actividad_con_relaciones')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const tbody = document.getElementById('actividadReciente');
        tbody.innerHTML = '';

        data.forEach(activity => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${activity.usuario_email || 'Usuario eliminado'}</td>
                <td>${activity.tipo_accion}</td>
                <td>${activity.dataset_nombre || 'Dataset eliminado'}</td>
                <td>${new Date(activity.created_at).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al cargar actividad reciente:', error.message);
        mostrarError('Error al cargar la actividad reciente');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar sesión y configurar listener
        await auth.checkSession();
        auth.setOnAuthStateChange(user => {
            if (!user) {
                window.location.href = '../login.html';
            }
        });

        // Cargar datos iniciales
        await Promise.all([
            loadStats(),
            loadRecentActivity()
        ]);

        // Manejar navegación
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                showSection(section);
            });
        });

        // Manejar cierre de sesión
        document.getElementById('btnLogout').addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await auth.signOut();
            } catch (error) {
                console.error('Error al cerrar sesión:', error.message);
                mostrarError('Error al cerrar sesión');
            }
        });

        // Inicializar tooltips de Bootstrap
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Actualizar datos cada 5 minutos
        setInterval(async () => {
            await Promise.all([
                loadStats(),
                loadRecentActivity()
            ]);
        }, 5 * 60 * 1000);
    } catch (error) {
        console.error('Error al inicializar el dashboard:', error.message);
        mostrarError(error.message);
    }
});

// Función para mostrar/ocultar secciones
function showSection(sectionId) {
    try {
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });

        // Mostrar la sección seleccionada
        const section = document.getElementById(`${sectionId}Section`);
        if (!section) {
            throw new Error(`No se encontró la sección: ${sectionId}`);
        }
        section.style.display = 'block';

        // Actualizar navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');

        // Actualizar información de la sección
        const sectionInfo = document.getElementById('sectionInfo');
        const alertHeading = sectionInfo.querySelector('.alert-heading');
        const alertContent = sectionInfo.querySelector('p');
        const alertList = sectionInfo.querySelector('ul');

        switch(sectionId) {
            case 'dashboard':
                alertHeading.innerHTML = '<i class="bi bi-speedometer2"></i> Dashboard';
                alertContent.textContent = 'Bienvenido al Panel de Administración de OpenData. Aquí podrás:';
                alertList.innerHTML = `
                    <li>Ver estadísticas generales del sistema</li>
                    <li>Monitorear la actividad reciente</li>
                    <li>Acceder rápidamente a las funciones principales</li>
                    <li>Gestionar usuarios, datos y configuraciones</li>
                `;
                break;
            case 'usuarios':
                alertHeading.innerHTML = '<i class="bi bi-people"></i> Gestión de Usuarios';
                alertContent.textContent = 'En esta sección puedes administrar los usuarios del sistema:';
                alertList.innerHTML = `
                    <li>Crear nuevos usuarios y asignar roles (Admin, Profesor, Estudiante)</li>
                    <li>Editar información y permisos de usuarios existentes</li>
                    <li>Desactivar o eliminar cuentas de usuario</li>
                    <li>Ver el historial de actividad de cada usuario</li>
                `;
                break;
            case 'datos':
                alertHeading.innerHTML = '<i class="bi bi-table"></i> Gestión de Datos';
                alertContent.textContent = 'Administra los conjuntos de datos (datasets) del sistema:';
                alertList.innerHTML = `
                    <li>Subir nuevos conjuntos de datos con metadatos</li>
                    <li>Organizar datos por categorías y etiquetas</li>
                    <li>Gestionar permisos de acceso a los datos</li>
                    <li>Monitorear descargas y uso de los datasets</li>
                `;
                break;
            case 'reportes':
                alertHeading.innerHTML = '<i class="bi bi-graph-up"></i> Reportes y Estadísticas';
                alertContent.textContent = 'Analiza el uso y rendimiento del sistema:';
                alertList.innerHTML = `
                    <li>Ver estadísticas detalladas de uso</li>
                    <li>Generar informes personalizados</li>
                    <li>Analizar tendencias de uso y descargas</li>
                    <li>Exportar datos para análisis externos</li>
                `;
                break;
            case 'configuracion':
                alertHeading.innerHTML = '<i class="bi bi-gear"></i> Configuración del Sistema';
                alertContent.textContent = 'Personaliza y configura el sistema:';
                alertList.innerHTML = `
                    <li>Ajustar preferencias generales del sistema</li>
                    <li>Configurar notificaciones y alertas</li>
                    <li>Gestionar copias de seguridad</li>
                    <li>Personalizar la apariencia del sistema</li>
                `;
                break;
        }
    } catch (error) {
        console.error('Error al mostrar sección:', error.message);
        mostrarError(error.message);
    }
}
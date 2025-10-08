// app.js
// Inicializar el cliente de Supabase
const SUPABASE_URL = 'https://yjrrtufenyfuhdycueyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcnJ0dWZlbnlmdWhkeWN1ZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjA3NzEsImV4cCI6MjA3NDg5Njc3MX0.OiyO2QKj7nTYAS8-9QSMNqqjvV_1ZWX_KBJYZLmk5s4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("Supabase cliente inicializado.");

// Función para mostrar errores en la interfaz
function mostrarError(mensaje) {
    const container = document.getElementById('avisos-container');
    container.innerHTML = `
        <div class="col-12 text-center">
            <div class="alert alert-danger" role="alert">
                ${mensaje}
            </div>
        </div>
    `;
}

// Función para renderizar un aviso
function renderizarAviso(publicacion) {
    const esDestacado = publicacion.es_aviso_principal ? 'bg-primary' : 'bg-secondary';
    const fecha = new Date(publicacion.fecha_publicacion).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 ${publicacion.es_aviso_principal ? 'border-primary' : ''}">
                <div class="card-body">
                    <span class="badge ${esDestacado} category-badge">
                        ${publicacion.es_aviso_principal ? 'Destacado' : 'General'}
                    </span>
                    <h5 class="card-title">${publicacion.titulo}</h5>
                    <p class="announcement-date"><i class="bi bi-calendar3"></i> ${fecha}</p>
                    <p class="card-text">${publicacion.contenido}</p>
                    <a href="#" class="btn btn-outline-primary" onclick="verDetalles('${publicacion.id}')">Leer más</a>
                </div>
            </div>
        </div>
    `;
}

// Función principal para cargar avisos
async function cargarAvisos() {
    try {
        const { data, error } = await supabase
            .from('publicaciones')
            .select('*')
            .order('fecha_publicacion', { ascending: false })
            .limit(6);

        if (error) throw error;

        const container = document.getElementById('avisos-container');
        if (!container) {
            console.error('No se encontró el contenedor de avisos');
            return;
        }

        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p>No hay publicaciones disponibles.</p>
                </div>
            `;
            return;
        }

        data.forEach(publicacion => {
            container.innerHTML += renderizarAviso(publicacion);
        });

    } catch (error) {
        console.error('Error al cargar avisos:', error);
        mostrarError('No se pudieron cargar los avisos. Por favor, intenta más tarde.');
    }
}

// Función para ver detalles de un aviso
window.verDetalles = async function(id) {
    try {
        const { data, error } = await supabase
            .from('publicaciones')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Aquí podrías mostrar un modal con los detalles
        console.log('Detalles del aviso:', data);
        alert(`Título: ${data.titulo}\n\nContenido: ${data.contenido}`);
    } catch (error) {
        console.error('Error al cargar los detalles:', error);
        alert('No se pudieron cargar los detalles del aviso.');
    }
};

// Función para cargar cursos en el menú
async function cargarCursos() {
    try {
        console.log('Iniciando carga de cursos...');
        const { data: cursos, error } = await supabase
            .from('horario')
            .select('*');

        if (error) throw error;

        console.log('Datos recibidos de Supabase:', cursos);

        if (!cursos || cursos.length === 0) {
            console.log('No se encontraron cursos en la base de datos');
            return;
        }

        // Eliminar duplicados usando Set y filtrar valores nulos
        const cursosUnicos = [...new Set(cursos
            .filter(c => c.curso && c.curso.trim() !== '') // Filtrar cursos null, vacíos o solo espacios
            .map(c => c.curso))]
            .sort(); // Ordenar alfabéticamente

        console.log('Cursos únicos encontrados:', cursosUnicos);

        const menuCursos = document.getElementById('listaCursos');
        if (!menuCursos) return;

        if (cursosUnicos.length === 0) {
            menuCursos.innerHTML = `
                <li><a class="dropdown-item" href="#">No hay cursos disponibles</a></li>
            `;
            return;
        }

        menuCursos.innerHTML = cursosUnicos.map(curso => `
            <li>
                <a class="dropdown-item" href="#" onclick="verHorarioCurso('${curso}')">
                    <i class="bi bi-mortarboard-fill"></i> ${curso}
                </a>
            </li>
        `).join('');

    } catch (error) {
        console.error('Error al cargar cursos:', error);
        const menuCursos = document.getElementById('listaCursos');
        if (menuCursos) {
            menuCursos.innerHTML = `
                <li><a class="dropdown-item text-danger" href="#">Error al cargar cursos</a></li>
            `;
        }
    }
}

// Función para ver el horario de un curso específico
window.verHorarioCurso = function(nombreCurso) {
    // Redireccionar al horario con el curso como parámetro, asegurando el formato correcto
    const cursoFormateado = nombreCurso.replace('º', '').replace('°', ''); // Elimina º o ° si existen
    window.location.href = `ejemplos/horario/index.html?curso=${encodeURIComponent(cursoFormateado)}`;
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarAvisos();
    cargarCursos();

    // Configurar los filtros
    document.querySelectorAll('.btn-outline-primary').forEach(button => {
        button.addEventListener('click', async (e) => {
            const filtro = e.target.textContent.toLowerCase();
            try {
                let query = supabase
                    .from('publicaciones')
                    .select('*')
                    .order('fecha_publicacion', { ascending: false });

                if (filtro === 'destacados') {
                    query = query.eq('es_aviso_principal', true);
                }

                const { data, error } = await query;
                if (error) throw error;

                const container = document.getElementById('avisos-container');
                container.innerHTML = '';
                data.forEach(publicacion => {
                    container.innerHTML += renderizarAviso(publicacion);
                });
            } catch (error) {
                console.error('Error al filtrar publicaciones:', error);
                mostrarError('Error al filtrar las publicaciones.');
            }
        });
    });
});
async function handleLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('Error de autenticación: ' + error.message);
        return;
    }

    // Éxito: data.user contiene el usuario logueado.
    console.log('Usuario autenticado:', data.user);
    alert('¡Login exitoso!');

    // Siguiente paso clave: Obtener el rol y redirigir
    await obtenerRolYRedirigir(data.user.id);
}

// Función para obtener el rol del usuario de nuestra tabla 'usuarios'
async function obtenerRolYRedirigir(userId) {
    const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single(); // Esperamos solo un resultado

    if (error) {
        console.error('Error al obtener el rol:', error);
        // Desconectar si no se encuentra el rol (medida de seguridad)
        await supabase.auth.signOut();
        alert('Usuario no tiene un rol asignado. Por favor, contacte a soporte.');
        return;
    }

    const rol = data.rol;
    console.log('Rol del usuario:', rol);

    // **Tarea de redirección:** Crea estos archivos .html
    if (rol === 'admin') {
        window.location.href = './admin-dashboard.html';
    } else if (rol === 'padre') {
        window.location.href = './padre-dashboard.html';
    } else if (rol === 'estudiante') {
        window.location.href = './estudiante-dashboard.html';
    }
}

// app.js (Continuación)
async function handleLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('Error de autenticación: ' + error.message);
        return;
    }

    // Éxito: data.user contiene el usuario logueado.
    console.log('Usuario autenticado:', data.user);
    alert('¡Login exitoso!');

    // Siguiente paso clave: Obtener el rol y redirigir
    await obtenerRolYRedirigir(data.user.id);
}

// Función para obtener el rol del usuario de nuestra tabla 'usuarios'
async function obtenerRolYRedirigir(userId) {
    const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single(); // Esperamos solo un resultado

    if (error) {
        console.error('Error al obtener el rol:', error);
        // Desconectar si no se encuentra el rol (medida de seguridad)
        await supabase.auth.signOut();
        alert('Usuario no tiene un rol asignado. Por favor, contacte a soporte.');
        return;
    }

    const rol = data.rol;
    console.log('Rol del usuario:', rol);

    // **Tarea de redirección:** Crea estos archivos .html
    if (rol === 'admin') {
        window.location.href = './admin-dashboard.html';
    } else if (rol === 'padre') {
        window.location.href = './padre-dashboard.html';
    } else if (rol === 'estudiante') {
        window.location.href = './estudiante-dashboard.html';
    }
}
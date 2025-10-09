// Módulo de galería
import { supabase } from './supabase.js';

console.log('[Galería] Iniciando módulo...');

let categoriaActual = 'todas';
const galeriaContainer = document.getElementById('galeria-container');

// Función para cargar las imágenes
async function cargarImagenes() {
    try {
        console.log('[Galería] Cargando imágenes...');
        
        // Obtener imágenes de Supabase
        let query = supabase.from('imagenes')
            .select('*')
            .eq('activa', true)
            .order('created_at', { ascending: false });

        // Filtrar por categoría si no es 'todas'
        if (categoriaActual !== 'todas') {
            query = query.eq('categoria', categoriaActual);
        }

        const { data: imagenes, error } = await query;

        if (error) throw error;

        // Si no hay imágenes
        if (!imagenes || imagenes.length === 0) {
            galeriaContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">No hay imágenes disponibles en esta categoría.</p>
                </div>
            `;
            return;
        }

        // Renderizar imágenes
        galeriaContainer.innerHTML = imagenes.map(imagen => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <img src="${imagen.url}" 
                         class="card-img-top" 
                         alt="${imagen.titulo}"
                         style="height: 250px; object-fit: cover; cursor: pointer;"
                         onclick="abrirImagenModal('${imagen.url}', '${imagen.titulo}', '${imagen.descripcion || ''}')"
                    >
                    <div class="card-body">
                        <h5 class="card-title">${imagen.titulo}</h5>
                        ${imagen.descripcion ? `<p class="card-text">${imagen.descripcion}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('[Galería] Error al cargar imágenes:', error);
        galeriaContainer.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Error al cargar las imágenes. Por favor, intente más tarde.</p>
            </div>
        `;
    }
}

// Función para cambiar categoría
function cambiarCategoria(categoria) {
    categoriaActual = categoria;
    
    // Actualizar botones
    document.querySelectorAll('.categoria-galeria').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.categoria === categoria);
    });
    
    // Mostrar loading
    galeriaContainer.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p><small>Cargando imágenes...</small></p>
        </div>
    `;
    
    // Recargar imágenes
    cargarImagenes();
}

// Función para abrir modal con imagen
function abrirImagenModal(url, titulo, descripcion) {
    const modal = new bootstrap.Modal(document.getElementById('imagenModal'));
    document.getElementById('imagenModalTitle').textContent = titulo;
    document.getElementById('imagenModalImg').src = url;
    document.getElementById('imagenModalDesc').textContent = descripcion;
    modal.show();
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos de botones de categoría
    document.querySelectorAll('.categoria-galeria').forEach(btn => {
        btn.addEventListener('click', () => {
            cambiarCategoria(btn.dataset.categoria);
        });
    });

    // Cargar imágenes iniciales
    cargarImagenes();
});

// Exportar funciones para uso global
window.abrirImagenModal = abrirImagenModal;
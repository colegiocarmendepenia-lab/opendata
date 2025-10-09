// Módulo para la gestión de imágenes
import { supabase, mostrarError, mostrarExito } from '../auth.js';

console.log('[Imágenes] Iniciando módulo...');

// Referencia al contenedor principal
let mainContainer = null;

// Función para inicializar el módulo
export function inicializarModuloImagenes(container) {
    console.log('[Imágenes] Inicializando módulo...');
    mainContainer = container;
    renderizarInterfaz();
    configurarEventos();
}

// Función para renderizar la interfaz principal
function renderizarInterfaz() {
    mainContainer.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Gestión de Imágenes</h5>
                <button class="btn btn-primary" id="btnNuevaImagen">
                    <i class="bi bi-plus-circle"></i> Nueva Imagen
                </button>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col">
                        <select class="form-select" id="filtroCategoria">
                            <option value="">Todas las categorías</option>
                            <option value="principal">Banner Principal</option>
                            <option value="galeria">Galería</option>
                            <option value="noticias">Noticias</option>
                            <option value="eventos">Eventos</option>
                        </select>
                    </div>
                </div>
                <div class="row" id="galeriaImagenes">
                    <!-- Las imágenes se cargarán aquí -->
                </div>
            </div>
        </div>
    `;

    cargarImagenes();
}

// Función para configurar eventos
function configurarEventos() {
    // Evento para nueva imagen
    document.getElementById('btnNuevaImagen').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('modalImagen'));
        document.getElementById('formImagen').reset();
        document.getElementById('previewImagen').classList.add('d-none');
        document.getElementById('btnEliminarImagen').style.display = 'none';
        modal.show();
    });

    // Preview de imagen
    document.getElementById('archivoImagen').addEventListener('change', mostrarPreview);

    // Filtro por categoría
    document.getElementById('filtroCategoria').addEventListener('change', cargarImagenes);

    // Guardar imagen
    document.getElementById('btnGuardarImagen').addEventListener('click', guardarImagen);

    // Eliminar imagen
    document.getElementById('btnEliminarImagen').addEventListener('click', eliminarImagen);
}

// Función para mostrar preview de imagen
function mostrarPreview(event) {
    const archivo = event.target.files[0];
    if (archivo) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('previewImagen');
            preview.querySelector('img').src = e.target.result;
            preview.classList.remove('d-none');
        };
        reader.readAsDataURL(archivo);
    }
}

// Función para cargar imágenes
async function cargarImagenes() {
    try {
        const categoria = document.getElementById('filtroCategoria').value;
        let query = supabase.from('imagenes').select('*').order('created_at', { ascending: false });
        
        if (categoria) {
            query = query.eq('categoria', categoria);
        }

        const { data: imagenes, error } = await query;

        if (error) throw error;

        const galeriaContainer = document.getElementById('galeriaImagenes');
        galeriaContainer.innerHTML = imagenes.map(imagen => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <img src="${imagen.url}" class="card-img-top" alt="${imagen.titulo}"
                         style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${imagen.titulo}</h5>
                        <p class="card-text">${imagen.descripcion || ''}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-primary">${imagen.categoria}</span>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" 
                                       ${imagen.activa ? 'checked' : ''}
                                       onchange="toggleImagenActiva(${imagen.id}, this.checked)">
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-primary" onclick="editarImagen(${imagen.id})">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarImagen(${imagen.id})">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error al cargar imágenes:', error);
        mostrarError('Error al cargar las imágenes');
    }
}

// Función para guardar imagen
async function guardarImagen() {
    try {
        const form = document.getElementById('formImagen');
        const archivo = document.getElementById('archivoImagen').files[0];
        
        if (!archivo && !form.imagenId.value) {
            throw new Error('Debe seleccionar una imagen');
        }

        // Si hay archivo, subirlo primero
        let urlImagen = null;
        if (archivo) {
            const { data, error } = await supabase.storage
                .from('imagenes')
                .upload(`public/${Date.now()}_${archivo.name}`, archivo);

            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage
                .from('imagenes')
                .getPublicUrl(data.path);
                
            urlImagen = publicUrl;
        }

        const imagen = {
            titulo: form.tituloImagen.value.trim(),
            descripcion: form.descripcionImagen.value.trim(),
            categoria: form.categoriaImagen.value,
            activa: form.activaImagen.checked
        };

        if (urlImagen) {
            imagen.url = urlImagen;
        }

        let error;
        if (form.imagenId.value) {
            // Actualizar
            ({ error } = await supabase
                .from('imagenes')
                .update(imagen)
                .eq('id', form.imagenId.value));
        } else {
            // Insertar
            ({ error } = await supabase
                .from('imagenes')
                .insert([imagen]));
        }

        if (error) throw error;

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalImagen'));
        modal.hide();
        mostrarExito('Imagen guardada con éxito');
        cargarImagenes();

    } catch (error) {
        console.error('Error al guardar imagen:', error);
        mostrarError(error.message);
    }
}

// Función para eliminar imagen
async function eliminarImagen(id) {
    if (confirm('¿Está seguro de eliminar esta imagen?')) {
        try {
            const { data: imagen } = await supabase
                .from('imagenes')
                .select('url')
                .eq('id', id)
                .single();

            // Eliminar archivo de storage
            if (imagen?.url) {
                const urlPartes = imagen.url.split('/');
                const nombreArchivo = urlPartes[urlPartes.length - 1];
                await supabase.storage
                    .from('imagenes')
                    .remove([`public/${nombreArchivo}`]);
            }

            // Eliminar registro
            const { error } = await supabase
                .from('imagenes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            mostrarExito('Imagen eliminada con éxito');
            cargarImagenes();

        } catch (error) {
            console.error('Error al eliminar imagen:', error);
            mostrarError('Error al eliminar la imagen');
        }
    }
}

// Función para editar imagen
async function editarImagen(id) {
    try {
        const { data: imagen, error } = await supabase
            .from('imagenes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const form = document.getElementById('formImagen');
        form.imagenId.value = imagen.id;
        form.tituloImagen.value = imagen.titulo;
        form.descripcionImagen.value = imagen.descripcion || '';
        form.categoriaImagen.value = imagen.categoria;
        form.activaImagen.checked = imagen.activa;

        const preview = document.getElementById('previewImagen');
        preview.querySelector('img').src = imagen.url;
        preview.classList.remove('d-none');

        document.getElementById('btnEliminarImagen').style.display = 'block';

        const modal = new bootstrap.Modal(document.getElementById('modalImagen'));
        modal.show();

    } catch (error) {
        console.error('Error al cargar imagen:', error);
        mostrarError('Error al cargar la imagen');
    }
}

// Función para cambiar estado activo/inactivo
async function toggleImagenActiva(id, activa) {
    try {
        const { error } = await supabase
            .from('imagenes')
            .update({ activa })
            .eq('id', id);

        if (error) throw error;

        mostrarExito('Estado actualizado con éxito');

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        mostrarError('Error al actualizar el estado');
        // Revertir el cambio en el checkbox
        const checkbox = document.querySelector(`input[type="checkbox"][data-id="${id}"]`);
        if (checkbox) {
            checkbox.checked = !activa;
        }
    }
}

// Exportar funciones necesarias para la navegación global
window.editarImagen = editarImagen;
window.eliminarImagen = eliminarImagen;
window.toggleImagenActiva = toggleImagenActiva;
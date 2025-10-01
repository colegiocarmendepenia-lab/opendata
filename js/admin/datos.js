// Gestión de datasets
document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a elementos del DOM
    const btnGuardarDataset = document.getElementById('btnGuardarDataset');
    const formNuevoDataset = document.getElementById('formNuevoDataset');

    // Event listeners
    if (btnGuardarDataset) {
        btnGuardarDataset.addEventListener('click', handleNuevoDataset);
    }

    // Cargar lista de datasets al mostrar la sección
    document.querySelector('.nav-link[data-section="datos"]').addEventListener('click', () => {
        cargarListaDatasets();
    });
});

// Función para crear nuevo dataset
async function handleNuevoDataset() {
    try {
        // Validar que se hayan llenado todos los campos
        const nombre = document.getElementById('nombreDataset').value;
        const descripcion = document.getElementById('descripcion').value;
        const categoria = document.getElementById('categoria').value;
        const archivo = document.getElementById('archivo').files[0];

        if (!nombre || !descripcion || !categoria || !archivo) {
            throw new Error('Por favor complete todos los campos');
        }

        // Validar tamaño del archivo (máximo 100MB)
        if (archivo.size > 100 * 1024 * 1024) {
            throw new Error('El archivo no puede ser mayor a 100MB');
        }

        // 1. Generar nombre único para el archivo
        const fileExt = archivo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${categoria}/${fileName}`;

        // 2. Subir archivo
        const { data: fileData, error: fileError } = await supabase.storage
            .from('datasets')
            .upload(filePath, archivo, {
                cacheControl: '3600',
                upsert: false
            });

        if (fileError) throw fileError;

        // 3. Obtener URL pública del archivo
        const { data: { publicUrl } } = supabase.storage
            .from('datasets')
            .getPublicUrl(filePath);

        // 4. Crear registro en la tabla datasets
        const { data: datasetData, error: datasetError } = await supabase
            .from('datasets')
            .insert([
                {
                    nombre: nombre,
                    descripcion: descripcion,
                    categoria: categoria,
                    archivo_url: filePath,
                    usuario_id: currentUser.id,
                    downloads: 0
                }
            ]);

        if (datasetError) throw datasetError;

        // 3. Registrar actividad
        await registrarActividad('crear_dataset', currentUser.id, { dataset_id: datasetData[0].id });

        // 4. Mostrar mensaje de éxito
        mostrarExito('Dataset creado exitosamente');
        
        // 5. Cerrar modal y actualizar lista
        const modal = bootstrap.Modal.getInstance(document.getElementById('nuevoDatasetModal'));
        modal.hide();
        await cargarListaDatasets();

    } catch (error) {
        console.error('Error al crear dataset:', error.message);
        mostrarError('Error al crear dataset: ' + error.message);
    }
}

// Función para cargar lista de datasets
async function cargarListaDatasets() {
    try {
        const { data: datasets, error } = await supabase
            .from('datasets_con_relaciones')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Actualizar la sección de datasets
        const datosSection = document.getElementById('datosSection');
        datosSection.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Gestión de Datasets</h5>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#nuevoDatasetModal">
                        <i class="bi bi-file-earmark-plus"></i> Nuevo Dataset
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Creado por</th>
                                    <th>Fecha</th>
                                    <th>Descargas</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${datasets.map(dataset => `
                                    <tr>
                                        <td>${dataset.nombre}</td>
                                        <td><span class="badge bg-${getCategoryBadgeColor(dataset.categoria)}">${dataset.categoria}</span></td>
                                        <td>${dataset.usuario_email || 'Usuario eliminado'}</td>
                                        <td>${new Date(dataset.created_at).toLocaleDateString()}</td>
                                        <td>${dataset.downloads || 0}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info" onclick="editarDataset('${dataset.id}')">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-success" onclick="descargarDataset('${dataset.id}')">
                                                <i class="bi bi-download"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="eliminarDataset('${dataset.id}')">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar datasets:', error.message);
        mostrarError('Error al cargar la lista de datasets');
    }
}

// Función para editar dataset
async function editarDataset(datasetId) {
    try {
        const { data: dataset, error } = await supabase
            .from('datasets')
            .select('*')
            .eq('id', datasetId)
            .single();

        if (error) throw error;

        // Implementar lógica de edición (modal, form, etc.)
        // Por ahora solo mostramos alerta
        alert('Función de edición en desarrollo');
    } catch (error) {
        console.error('Error al editar dataset:', error.message);
        mostrarError('Error al editar dataset');
    }
}

// Función para descargar dataset
async function descargarDataset(datasetId) {
    try {
        // 1. Obtener información del dataset
        const { data: dataset, error: datasetError } = await supabase
            .from('datasets')
            .select('archivo_url')
            .eq('id', datasetId)
            .single();

        if (datasetError) throw datasetError;

        // 2. Obtener URL de descarga
        const { data: fileData, error: fileError } = await supabase.storage
            .from('datasets')
            .createSignedUrl(dataset.archivo_url, 60); // URL válida por 60 segundos

        if (fileError) throw fileError;

        // 3. Registrar descarga
        await supabase
            .from('descargas')
            .insert([{
                dataset_id: datasetId,
                usuario_id: currentUser.id
            }]);

        // 4. Iniciar descarga
        window.open(fileData.signedUrl);

    } catch (error) {
        console.error('Error al descargar dataset:', error.message);
        mostrarError('Error al descargar dataset');
    }
}

// Función para eliminar dataset
async function eliminarDataset(datasetId) {
    if (!confirm('¿Está seguro de que desea eliminar este dataset?')) return;

    try {
        // 1. Obtener información del dataset
        const { data: dataset, error: datasetError } = await supabase
            .from('datasets')
            .select('archivo_url')
            .eq('id', datasetId)
            .single();

        if (datasetError) throw datasetError;

        // 2. Eliminar archivo
        const { error: storageError } = await supabase.storage
            .from('datasets')
            .remove([dataset.archivo_url]);

        if (storageError) throw storageError;

        // 3. Eliminar registro
        const { error: deleteError } = await supabase
            .from('datasets')
            .delete()
            .eq('id', datasetId);

        if (deleteError) throw deleteError;

        // 4. Registrar actividad
        await registrarActividad('eliminar_dataset', currentUser.id, { dataset_id: datasetId });

        // 5. Actualizar lista
        await cargarListaDatasets();

        // 6. Mostrar mensaje de éxito
        mostrarExito('Dataset eliminado exitosamente');

    } catch (error) {
        console.error('Error al eliminar dataset:', error.message);
        mostrarError('Error al eliminar dataset: ' + error.message);
    }
}

// Funciones auxiliares
function getCategoryBadgeColor(categoria) {
    switch(categoria) {
        case 'educacion': return 'primary';
        case 'ciencia': return 'info';
        case 'tecnologia': return 'success';
        default: return 'secondary';
    }
}

async function registrarActividad(tipo, usuarioId, detalles = {}) {
    try {
        await supabase
            .from('actividad')
            .insert([{
                usuario_id: usuarioId,
                tipo_accion: tipo,
                detalles: detalles
            }]);
    } catch (error) {
        console.error('Error al registrar actividad:', error.message);
    }
}
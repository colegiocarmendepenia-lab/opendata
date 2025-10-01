// Inicializar el cliente de Supabase
const SUPABASE_URL = 'https://yjrrtufenyfuhdycueyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcnJ0dWZlbnlmdWhkeWN1ZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjA3NzEsImV4cCI6MjA3NDg5Njc3MX0.OiyO2QKj7nTYAS8-9QSMNqqjvV_1ZWX_KBJYZLmk5s4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', function() {
    const resetForm = document.getElementById('resetForm');
    
    function mostrarMensaje(mensaje, tipo = 'error') {
        const mensajeAnterior = document.querySelector('.alert');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${tipo === 'error' ? 'alert-danger' : 'alert-success'} mt-3`;
        alertDiv.role = 'alert';
        alertDiv.textContent = mensaje;

        resetForm.insertBefore(alertDiv, resetForm.firstChild);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        
        // Deshabilitar el botón de submit
        const submitButton = resetForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password-confirm.html',
            });

            if (error) {
                throw error;
            }

            mostrarMensaje('Se ha enviado un enlace a tu correo para restablecer la contraseña.', 'success');
            
        } catch (error) {
            console.error('Error al restablecer la contraseña:', error.message);
            mostrarMensaje(`Error: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar enlace de restablecimiento';
        }
    });
});
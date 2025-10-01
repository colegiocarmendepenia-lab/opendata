// Inicializar el cliente de Supabase
const SUPABASE_URL = 'https://yjrrtufenyfuhdycueyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcnJ0dWZlbnlmdWhkeWN1ZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjA3NzEsImV4cCI6MjA3NDg5Njc3MX0.OiyO2QKj7nTYAS8-9QSMNqqjvV_1ZWX_KBJYZLmk5s4';
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Objeto para almacenar el estado de la autenticación
const auth = {
    currentUser: null,
    onAuthStateChange: null,
    
    // Función para verificar la sesión del usuario
    async checkSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error al verificar la sesión:', error.message);
            window.location.href = '../login.html';
            return;
        }

        if (!session) {
            window.location.href = '../login.html';
            return;
        }

        this.currentUser = session.user;
        
        // Verificar si el usuario es administrador
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', this.currentUser.id)
            .single();

        if (userError || !userData || userData.rol !== 'admin') {
            console.error('Usuario no autorizado');
            await this.signOut();
            window.location.href = '../login.html';
            return;
        }

        // Actualizar nombre de usuario en la interfaz si existe el elemento
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.email;
        }

        // Notificar el cambio de estado si hay un callback registrado
        if (this.onAuthStateChange) {
            this.onAuthStateChange(this.currentUser);
        }

        return this.currentUser;
    },

    // Función para cerrar sesión
    async signOut() {
        try {
            await supabase.auth.signOut();
            this.currentUser = null;
            window.location.href = '../login.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error.message);
            throw error;
        }
    },

    // Función para registrar un callback cuando cambie el estado de autenticación
    setOnAuthStateChange(callback) {
        this.onAuthStateChange = callback;
        // Si ya hay un usuario, llamar al callback inmediatamente
        if (this.currentUser) {
            callback(this.currentUser);
        }
    }
};

export default auth;
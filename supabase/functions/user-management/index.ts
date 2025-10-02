// @deno-types="https://deno.land/x/types/deno.ns.d.ts"
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://colegiocarmendepenia-lab.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

interface UserManagementRequest {
  action: 'create' | 'delete' | 'update';
  email?: string;
  password?: string;
  rol?: string;
  perfilId?: string;
  userId?: string;
}

interface CustomError extends Error {
  status?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar que sea una petición válida
    if (!['POST', 'DELETE'].includes(req.method)) {
      throw new Error('Method not allowed');
    }

    // Obtener y validar el token de autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authentication token provided');
    }

    // Verificar que el usuario sea administrador
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Verificar que el usuario sea administrador
    const { data: userData, error: roleError } = await supabaseClient
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (roleError || userData?.rol !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    // Procesar la petición
    const { action, ...data }: UserManagementRequest = await req.json();

    let result;
    switch (action) {
      case 'create':
        if (!data.email || !data.password || !data.rol) {
          throw new Error('Missing required fields for user creation');
        }
        
        // 1. Crear usuario en Auth
        const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: { rol: data.rol }
        });

        if (createError) throw createError;

        try {
          // 2. Crear registro en tabla usuarios
          const { error: insertError } = await supabaseClient
            .from('usuarios')
            .insert([{
              id: authData.user.id,
              email: data.email,
              rol: data.rol,
              perfil_id: data.perfilId || null
            }]);

          if (insertError) {
            // Si falla la inserción en la tabla, eliminamos el usuario de Auth
            await supabaseClient.auth.admin.deleteUser(authData.user.id);
            throw insertError;
          }
        } catch (error) {
          // Si ocurre cualquier error, aseguramos eliminar el usuario de Auth
          await supabaseClient.auth.admin.deleteUser(authData.user.id);
          throw error;
        }

        result = { message: 'Usuario creado exitosamente', userId: authData.user.id };
        break;

      case 'delete':
        if (!data.userId) {
          throw new Error('User ID is required for deletion');
        }

        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(data.userId);
        if (deleteError) throw deleteError;

        result = { message: 'Usuario eliminado exitosamente' };
        break;

      case 'update':
        if (!data.userId) {
          throw new Error('User ID is required for update');
        }

        // Actualizar metadata si se proporciona un rol
        if (data.rol) {
          const { error: updateAuthError } = await supabaseClient.auth.admin.updateUserById(
            data.userId,
            { user_metadata: { rol: data.rol } }
          );
          if (updateAuthError) throw updateAuthError;
        }

        // Actualizar datos en la tabla usuarios
        const updateData: any = {};
        if (data.rol) updateData.rol = data.rol;
        if (data.perfilId !== undefined) updateData.perfil_id = data.perfilId;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseClient
            .from('usuarios')
            .update(updateData)
            .eq('id', data.userId);

          if (updateError) throw updateError;
        }

        result = { message: 'Usuario actualizado exitosamente' };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Vary': 'Origin'
      },
      status: 200,
    });

  } catch (err: unknown) {
    const error = err as CustomError;
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.status || 400,
    });
  }
});
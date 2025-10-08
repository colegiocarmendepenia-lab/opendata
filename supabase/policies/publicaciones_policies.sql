-- Habilitar RLS en la tabla publicaciones
alter table publicaciones enable row level security;

-- Política para SELECT: permitir ver publicaciones a todos los usuarios autenticados
create policy "Todos pueden ver publicaciones"
on publicaciones for select
to authenticated
using (true);

-- Política para INSERT: permitir crear publicaciones a admin y coordinador
create policy "Permitir inserción a admin y coordinador"
on public.publicaciones
for insert
to public
with check (
    auth.uid() IN (
        SELECT usuarios_con_perfiles.id
        FROM usuarios_con_perfiles
        WHERE (usuarios_con_perfiles.perfil_id = ANY (ARRAY[1, 2]))
    )
);

-- Política para UPDATE: permitir actualizar publicaciones a admin y coordinador
create policy "Permitir actualización a admin y coordinador"
on public.publicaciones
for update
to public
using (
    auth.uid() IN (
        SELECT usuarios_con_perfiles.id
        FROM usuarios_con_perfiles
        WHERE (usuarios_con_perfiles.perfil_id = ANY (ARRAY[1, 2]))
    )
);

-- Política para DELETE: permitir eliminar publicaciones a admin y coordinador
create policy "Permitir eliminación a admin y coordinador"
on public.publicaciones
for delete
to public
using (
    auth.uid() IN (
        SELECT usuarios_con_perfiles.id
        FROM usuarios_con_perfiles
        WHERE (usuarios_con_perfiles.perfil_id = ANY (ARRAY[1, 2]))
    )
);
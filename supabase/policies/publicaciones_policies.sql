-- Habilitar RLS en la tabla publicaciones
alter table publicaciones enable row level security;

-- Política para SELECT: permitir ver publicaciones a todos los usuarios autenticados
create policy "Todos pueden ver publicaciones"
on publicaciones for select
to authenticated
using (true);

-- Política para INSERT: permitir crear publicaciones a administradores y coordinadores
create policy "Administradores y coordinadores pueden crear publicaciones"
on publicaciones for insert
to authenticated
with check (
    auth.jwt() ->> 'role' in ('admin', 'coordinador')
);

-- Política para UPDATE: permitir actualizar publicaciones a administradores y coordinadores
create policy "Administradores y coordinadores pueden actualizar publicaciones"
on publicaciones for update
to authenticated
using (
    auth.jwt() ->> 'role' in ('admin', 'coordinador')
)
with check (
    auth.jwt() ->> 'role' in ('admin', 'coordinador')
);

-- Política para DELETE: permitir eliminar publicaciones a administradores y coordinadores
create policy "Administradores y coordinadores pueden eliminar publicaciones"
on publicaciones for delete
to authenticated
using (
    auth.jwt() ->> 'role' in ('admin', 'coordinador')
);
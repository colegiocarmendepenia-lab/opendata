-- Habilitar RLS en la tabla estudiantes
alter table estudiantes enable row level security;

-- Política para SELECT: permitir ver estudiantes a usuarios autenticados
create policy "Usuarios autenticados pueden ver estudiantes"
on estudiantes for select
to authenticated
using (true);

-- Política para INSERT: permitir crear estudiantes solo a administradores y coordinadores
create policy "Administradores y coordinadores pueden crear estudiantes"
on estudiantes for insert
to authenticated
with check (
    auth.jwt() ->> 'role' in ('admin', 'coordinador')
);

-- Política para UPDATE: permitir actualizar estudiantes a administradores, coordinadores y docentes asignados
create policy "Administradores, coordinadores y docentes pueden actualizar estudiantes"
on estudiantes for update
to authenticated
using (
    auth.jwt() ->> 'role' in ('admin', 'coordinador') or
    auth.jwt() ->> 'user_id' in (
        select profesor_id from asignaciones_curso 
        where curso_id = estudiantes.curso_id
    )
)
with check (
    auth.jwt() ->> 'role' in ('admin', 'coordinador') or
    auth.jwt() ->> 'user_id' in (
        select profesor_id from asignaciones_curso 
        where curso_id = estudiantes.curso_id
    )
);

-- Política para DELETE: permitir eliminar estudiantes solo a administradores
create policy "Solo administradores pueden eliminar estudiantes"
on estudiantes for delete
to authenticated
using (
    auth.jwt() ->> 'role' = 'admin'
);
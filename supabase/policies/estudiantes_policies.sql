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

-- Política para UPDATE: permitir actualizar estudiantes a administradores y coordinadores
-- También permite a los profesores actualizar estudiantes de los grados asignados
create policy "Administradores, coordinadores y profesores pueden actualizar estudiantes"
on estudiantes for update
to authenticated
using (
    auth.jwt() ->> 'role' in ('admin', 'coordinador') or
    exists (
        select 1 
        from asignaciones_docentes ad
        where ad.profesor_id = (auth.jwt() ->> 'user_id')::uuid
        and ad.grado = estudiantes.grado
        and ad.seccion = estudiantes.seccion
    )
)
with check (
    auth.jwt() ->> 'role' in ('admin', 'coordinador') or
    exists (
        select 1 
        from asignaciones_docentes ad
        where ad.profesor_id = (auth.jwt() ->> 'user_id')::uuid
        and ad.grado = estudiantes.grado
        and ad.seccion = estudiantes.seccion
    )
);

-- Política para DELETE: permitir eliminar estudiantes solo a administradores
create policy "Solo administradores pueden eliminar estudiantes"
on estudiantes for delete
to authenticated
using (
    auth.jwt() ->> 'role' = 'admin'
);
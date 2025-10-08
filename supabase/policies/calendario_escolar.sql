-- Habilitar RLS en la tabla horario
alter table calendario_escolar enable row level security;

-- Política para SELECT: permitir ver todos los horarios a usuarios autenticados
create policy "Usuarios autenticados pueden ver calendario_escolar"
on calendario_escolar for select
to authenticated
using (true);

-- Política para INSERT: permitir crear horarios a usuarios autenticados
create policy "Usuarios autenticados pueden crear calendario_escolar"
on calendario_escolar for insert
to authenticated
with check (true);

-- Política para UPDATE: permitir actualizar horarios a usuarios autenticados
create policy "Usuarios autenticados pueden actualizar calendario_escolar"
on calendario_escolar for update
to authenticated
using (true)
with check (true);

-- Política para DELETE: permitir eliminar horarios a usuarios autenticados
create policy "Usuarios autenticados pueden eliminar calendario_escolar"
on calendario_escolar for delete
to authenticated
using (true);
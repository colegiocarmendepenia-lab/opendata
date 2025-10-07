-- Habilitar RLS en la tabla horario
alter table horario enable row level security;

-- Política para SELECT: permitir ver todos los horarios a usuarios autenticados
create policy "Usuarios autenticados pueden ver horarios"
on horario for select
to authenticated
using (true);

-- Política para INSERT: permitir crear horarios a usuarios autenticados
create policy "Usuarios autenticados pueden crear horarios"
on horario for insert
to authenticated
with check (true);

-- Política para UPDATE: permitir actualizar horarios a usuarios autenticados
create policy "Usuarios autenticados pueden actualizar horarios"
on horario for update
to authenticated
using (true)
with check (true);

-- Política para DELETE: permitir eliminar horarios a usuarios autenticados
create policy "Usuarios autenticados pueden eliminar horarios"
on horario for delete
to authenticated
using (true);

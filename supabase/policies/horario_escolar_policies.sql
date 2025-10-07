-- Habilitar RLS en la tabla horario_escolar
alter table horario_escolar enable row level security;

-- Política para SELECT: permitir ver los detalles del horario a usuarios autenticados
create policy "Usuarios autenticados pueden ver detalles de horario"
on horario_escolar for select
to authenticated
using (true);

-- Política para INSERT: permitir crear detalles de horario a usuarios autenticados
create policy "Usuarios autenticados pueden crear detalles de horario"
on horario_escolar for insert
to authenticated
with check (true);

-- Política para UPDATE: permitir actualizar detalles de horario a usuarios autenticados
create policy "Usuarios autenticados pueden actualizar detalles de horario"
on horario_escolar for update
to authenticated
using (true)
with check (true);

-- Política para DELETE: permitir eliminar detalles de horario a usuarios autenticados
create policy "Usuarios autenticados pueden eliminar detalles de horario"
on horario_escolar for delete
to authenticated
using (true);
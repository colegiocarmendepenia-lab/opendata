-- Crear tabla de asignaturas
create table public.asignaturas (
    id uuid not null default extensions.uuid_generate_v4(),
    nombre text not null,
    descripcion text,
    created_at timestamp with time zone not null default now(),
    constraint asignaturas_pkey primary key (id)
);

-- Crear tabla de evaluaciones
create table public.evaluaciones (
    id uuid not null default extensions.uuid_generate_v4(),
    nombre text not null,
    descripcion text,
    fecha_inicio date not null,
    fecha_fin date not null,
    created_at timestamp with time zone not null default now(),
    constraint evaluaciones_pkey primary key (id)
);

-- Añadir datos de ejemplo para asignaturas
insert into public.asignaturas (nombre, descripcion) values
    ('Matemáticas', 'Matemáticas básicas y avanzadas'),
    ('Lengua y Literatura', 'Comprensión y expresión lingüística'),
    ('Ciencias Naturales', 'Estudio de la naturaleza y sus fenómenos'),
    ('Ciencias Sociales', 'Historia, geografía y sociedad'),
    ('Inglés', 'Lengua extranjera');

-- Añadir datos de ejemplo para evaluaciones
insert into public.evaluaciones (nombre, descripcion, fecha_inicio, fecha_fin) values
    ('Primer Parcial', 'Evaluación del primer periodo', '2025-03-01', '2025-03-15'),
    ('Segundo Parcial', 'Evaluación del segundo periodo', '2025-06-01', '2025-06-15'),
    ('Tercer Parcial', 'Evaluación del tercer periodo', '2025-09-01', '2025-09-15'),
    ('Evaluación Final', 'Evaluación final del año', '2025-11-15', '2025-11-30');
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import os

# Configurar el documento
doc = SimpleDocTemplate(
    "manual_proyecto.pdf",
    pagesize=letter,
    rightMargin=72,
    leftMargin=72,
    topMargin=72,
    bottomMargin=72
)

# Estilos
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    spaceAfter=30,
    textColor=colors.HexColor('#1a237e')
)

# Contenido del manual
content = []

# Título
content.append(Paragraph("Manual del Proyecto - Colegio Carmen de Peña", title_style))
content.append(Spacer(1, 12))

# 1. Descripción General
content.append(Paragraph("1. Descripción General", styles["Heading1"]))
content.append(Paragraph("""
El sistema de gestión escolar del Colegio Carmen de Peña es una aplicación web moderna 
que permite administrar diferentes aspectos de la institución educativa, incluyendo:
""", styles["Normal"]))

# Lista de características
features = [
    "Gestión de calificaciones",
    "Control de asistencia",
    "Calendario escolar",
    "Galería de imágenes",
    "Avisos y comunicaciones",
    "Horarios escolares"
]

for feature in features:
    content.append(Paragraph(f"• {feature}", styles["Normal"]))
content.append(Spacer(1, 12))

# 2. Arquitectura del Sistema
content.append(Paragraph("2. Arquitectura del Sistema", styles["Heading1"]))
content.append(Paragraph("""
El proyecto está construido utilizando las siguientes tecnologías:
""", styles["Normal"]))

tech_data = [
    ['Componente', 'Tecnología'],
    ['Frontend', 'HTML5, CSS3, JavaScript (ES6+)'],
    ['Backend', 'Supabase (Backend as a Service)'],
    ['Base de Datos', 'PostgreSQL (a través de Supabase)'],
    ['Autenticación', 'Supabase Auth'],
    ['UI Framework', 'Bootstrap 5.3.2']
]

tech_table = Table(tech_data, colWidths=[2*inch, 3*inch])
tech_table.setStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 14),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 12),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
])
content.append(tech_table)
content.append(Spacer(1, 12))

# 3. Estructura del Proyecto
content.append(Paragraph("3. Estructura del Proyecto", styles["Heading1"]))
content.append(Paragraph("""
El proyecto sigue una estructura modular con los siguientes directorios principales:
""", styles["Normal"]))

structure = [
    ["Directorio", "Descripción"],
    ["/admin", "Contiene los archivos del panel de administración"],
    ["/css", "Hojas de estilo CSS"],
    ["/js", "Scripts de JavaScript"],
    ["/img", "Recursos de imágenes"],
    ["/ejemplos", "Ejemplos y plantillas"]
]

struct_table = Table(structure, colWidths=[2*inch, 3*inch])
struct_table.setStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 14),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 12),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
])
content.append(struct_table)
content.append(Spacer(1, 12))

# 4. Instalación y Configuración
content.append(Paragraph("4. Instalación y Configuración", styles["Heading1"]))
content.append(Paragraph("""
Para instalar y configurar el proyecto, sigue estos pasos:
""", styles["Normal"]))

setup_steps = [
    "1. Clonar el repositorio desde GitHub",
    "2. Configurar las variables de entorno de Supabase",
    "3. Instalar las dependencias necesarias",
    "4. Inicializar la base de datos",
    "5. Ejecutar el proyecto en un servidor web"
]

for step in setup_steps:
    content.append(Paragraph(step, styles["Normal"]))
content.append(Spacer(1, 12))

# 5. Módulos Principales
content.append(Paragraph("5. Módulos Principales", styles["Heading1"]))

modules = [
    ["Módulo", "Funcionalidad"],
    ["Calificaciones", "Gestión de notas y evaluaciones"],
    ["Asistencias", "Control de asistencia de estudiantes"],
    ["Calendario", "Administración de eventos escolares"],
    ["Galería", "Gestión de imágenes y multimedia"],
    ["Avisos", "Sistema de comunicaciones"]
]

modules_table = Table(modules, colWidths=[2*inch, 3*inch])
modules_table.setStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 14),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 12),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
])
content.append(modules_table)

# 6. Consultas de Base de Datos
content.append(Paragraph("6. Consultas de Base de Datos", styles["Heading1"]))
content.append(Paragraph("""
El sistema utiliza las siguientes consultas SQL principales para obtener información:
""", styles["Normal"]))

# Consulta de Asistencias
content.append(Paragraph("Consulta de Asistencias", styles["Heading2"]))
content.append(Paragraph("""
La siguiente consulta se utiliza para obtener el reporte de asistencias de los estudiantes:
""", styles["Normal"]))

asistencias_sql = '''
SELECT 
    a.id,
    e.codigo_estudiante,
    e.grado,
    e.seccion,
    a.fecha,
    a.estado,
    a.materia,
    a.created_at as fecha_registro
FROM public.asistencias a
JOIN public.estudiantes e ON a.estudiante_id = e.id
WHERE 
    a.fecha = :fecha AND
    e.grado = :grado AND
    e.seccion = :seccion
ORDER BY 
    e.codigo_estudiante,
    a.fecha,
    a.materia;
'''

content.append(Paragraph(asistencias_sql, styles["Code"]))
content.append(Paragraph("""
Esta consulta proporciona:
• Código del estudiante
• Fecha de la asistencia
• Estado de la asistencia (presente, ausente, etc.)
• Materia correspondiente
""", styles["Normal"]))
content.append(Spacer(1, 12))

# Generar el PDF
doc.build(content)
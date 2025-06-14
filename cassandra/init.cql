-- Crear Keyspace para el sistema de votación
CREATE KEYSPACE IF NOT EXISTS sistema_votacion
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

-- Usar el keyspace
USE sistema_votacion;

--  Tabla: Elección
CREATE TABLE IF NOT EXISTS eleccion (
    id UUID PRIMARY KEY,
    nombre TEXT,
    fecha DATE,
    estado TEXT
);

-- Tabla: Candidatos por elección
CREATE TABLE IF NOT EXISTS candidatos_por_eleccion (
    id_eleccion UUID,
    id_candidato UUID,
    nombre TEXT,
    partido TEXT,
    PRIMARY KEY (id_eleccion, id_candidato)
);

-- Tabla: Votantes (registro y validación)
CREATE TABLE IF NOT EXISTS votantes (
    carnet TEXT PRIMARY KEY,
    nombre TEXT,
    ha_votado BOOLEAN
);

-- Tabla: Conteo de votos por candidato
CREATE TABLE IF NOT EXISTS votos_por_candidato (
    id_eleccion UUID,
    id_candidato UUID,
    total_votos COUNTER,
    PRIMARY KEY (id_eleccion, id_candidato)
);

--  Tabla: Registro de votos por estudiante
CREATE TABLE IF NOT EXISTS votos_detalle (
    id_eleccion UUID,
    carnet TEXT,
    id_candidato UUID,
    fecha_voto TIMESTAMP,
    PRIMARY KEY (id_eleccion, carnet)
);

-- Datos de ejemplo para testing
INSERT INTO eleccion (id, nombre, fecha, estado) 
VALUES (uuid(), 'Elección Estudiantil 2025', '2025-07-01', 'activa');

INSERT INTO votantes (carnet, nombre, ha_votado) 
VALUES ('EST001', 'Juan Pérez', false);
INSERT INTO votantes (carnet, nombre, ha_votado) 
VALUES ('EST002', 'María García', false);



    
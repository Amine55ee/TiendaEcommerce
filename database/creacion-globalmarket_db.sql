-- Creación de la base de datos
drop database if exists globalmarket_db;
CREATE DATABASE IF NOT EXISTS globalmarket_db;
USE globalmarket_db;

-- 1. Tabla Categoría
-- Relación (1,1) con Producto en el diagrama implica que es una entidad fuerte independiente.
CREATE TABLE Categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- 2. Tabla Usuario
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    contrasena VARCHAR(255) NOT NULL,
    direccion TEXT
);

-- 3. Tabla Producto
-- Tiene un FK 'id_categoria' explícito en el diagrama.
CREATE TABLE Producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    id_categoria INT NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. Tabla Pedido
CREATE TABLE Pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL,
    estado_pedido VARCHAR(50)
);

-- 5. Tabla Pago
-- Relación 1:1 con Pedido ("Asociado").
-- Se usa UNIQUE en id_pedido para garantizar la cardinalidad 1:1.
CREATE TABLE Pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT UNIQUE NOT NULL,
    metodo VARCHAR(50) NOT NULL,
    estado_pago VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==========================================
-- TABLAS INTERMEDIAS (RELACIONES N:M)
-- ==========================================

-- 6. Tabla Hace (Relación Usuario N:M Pedido)
-- Según el diagrama, la relación "Hace" es N:M.
CREATE TABLE Hace (
    id_usuario INT,
    id_pedido INT,
    PRIMARY KEY (id_usuario, id_pedido),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
        ON DELETE CASCADE,
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido)
        ON DELETE CASCADE
);

-- 7. Tabla Detalle_Pedido (Relación "Forma parte": Producto N:M Pedido)
-- Conecta Productos con Pedidos.
CREATE TABLE Detalle_Pedido (
    id_pedido INT,
    id_producto INT,
    -- Nota: Normalmente aquí iría una columna 'cantidad', pero no aparece en el diagrama.
    PRIMARY KEY (id_pedido, id_producto),
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido)
        ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
        ON DELETE RESTRICT
);

-- 8. Tabla Valoración (Relación "Deja valoración": Usuario N:M Producto)
-- Incluye el atributo 'valoración' que cuelga de la relación.
CREATE TABLE Valoracion (
    id_usuario INT,
    id_producto INT,
    valoracion INT CHECK (valoracion BETWEEN 1 AND 5), -- Restricción opcional sugerida
    PRIMARY KEY (id_usuario, id_producto),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
        ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
        ON DELETE CASCADE
);
-- ====================================================================
-- Script Unificado de Inicialización - GlobalMarket
-- ====================================================================

-- 1. PREPARACIÓN DE LA BASE DE DATOS
DROP DATABASE IF EXISTS globalmarket_db;
CREATE DATABASE globalmarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE globalmarket_db;

-- ====================================================================
-- 2. CREACIÓN DE ESTRUCTURAS DE TABLAS (Ordenadas por dependencias)
-- ====================================================================

CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellidos VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    contrasena VARCHAR(255) NOT NULL,
    direccion TEXT
);

CREATE TABLE Categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    id_categoria INT,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria) ON DELETE SET NULL
);

CREATE TABLE Pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado_pedido ENUM('Pendiente', 'Enviado', 'Entregado', 'Cancelado') DEFAULT 'Pendiente'
);

CREATE TABLE Pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    metodo ENUM('Tarjeta', 'PayPal', 'Transferencia') NOT NULL,
    estado_pago ENUM('Pendiente', 'Completado', 'Fallido') DEFAULT 'Pendiente',
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido) ON DELETE CASCADE
);

-- Tablas intermedias
CREATE TABLE Hace (
    id_usuario INT NOT NULL,
    id_pedido INT NOT NULL,
    PRIMARY KEY (id_usuario, id_pedido),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido) ON DELETE CASCADE
);

-- (Optimizado) Columna 'cantidad' integrada directamente en la creación
CREATE TABLE Detalle_Pedido (
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_pedido, id_producto),
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE CASCADE
);

CREATE TABLE Valoracion (
    id_usuario INT NOT NULL,
    id_producto INT NOT NULL,
    valoracion INT CHECK(valoracion BETWEEN 1 AND 5),
    PRIMARY KEY (id_usuario, id_producto),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE CASCADE
);

-- ====================================================================
-- 3. INSERCIÓN DE DATOS DE PRUEBA (MOCK DATA)
-- ====================================================================

-- Insertar Categorías
INSERT INTO Categoria (nombre, descripcion) VALUES
('Electrónica', 'Dispositivos y gadgets tecnológicos'),
('Hogar', 'Artículos para el hogar y decoración'),
('Moda', 'Ropa, calzado y accesorios');

-- Insertar Productos (Agrupados en una sola sentencia)
INSERT INTO Producto (nombre, descripcion, precio, stock, id_categoria) VALUES
('Auriculares Inalámbricos', 'Auriculares con cancelación de ruido', 29.99, 100, 1),
('Smartwatch Deportivo', 'Reloj inteligente con monitor de salud', 49.99, 50, 1),
('Lámpara LED Inteligente', 'Lámpara con colores ajustables vía app', 19.99, 200, 2),
('Mochila Antirrobo', 'Mochila con puerto USB y diseño seguro', 35.50, 75, 3),
('Soporte para Portátil Ajustable', 'Soporte ergonómico de aluminio', 25.00, 40, 1);

-- Insertar Usuarios (Hashes correspondientes a la encriptación de BCRYPT)
INSERT INTO Usuario (nombre, apellidos, email, telefono, contrasena, direccion) VALUES
('Admin', 'Principal', 'admin@globalmarket.com', '600123456', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Calle Principal 1, Madrid'),
('Juan', 'Pérez', 'juan@email.com', '611223344', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Avenida Libertad 5, Barcelona');
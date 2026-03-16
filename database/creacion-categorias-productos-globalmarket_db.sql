use globalmarket_db;

-- 1. Desactivar revisión de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Vaciar las tablas y reiniciar sus contadores (AUTO_INCREMENT) a 1
TRUNCATE TABLE Producto;
TRUNCATE TABLE Categoria;

-- 3. Volver a activar la revisión de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insertar categorías de prueba
INSERT INTO Categoria (nombre, descripcion) VALUES
('Electrónica', 'Dispositivos tecnológicos y accesorios'),
('Hogar', 'Artículos para el hogar y decoración');

-- 2. Insertar productos de prueba 
-- (Se asume que 'Electrónica' recibe el id_categoria = 1 y 'Hogar' el id_categoria = 2)
INSERT INTO Producto (nombre, descripcion, precio, stock, id_categoria) VALUES
('Auriculares Inalámbricos', 'Auriculares con cancelación de ruido y bluetooth 5.0.', 29.99, 50, 1),
('Smartwatch Deportivo', 'Reloj inteligente resistente al agua con monitor cardíaco.', 49.99, 30, 1),
('Lámpara LED Inteligente', 'Lámpara de escritorio con carga inalámbrica para móvil.', 19.99, 100, 2),
('Mochila Antirrobo', 'Mochila impermeable con puerto USB integrado.', 35.50, 75, 2);
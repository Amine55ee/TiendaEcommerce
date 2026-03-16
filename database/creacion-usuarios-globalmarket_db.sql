use globalmarket_db;

-- Insertar usuarios de prueba
-- (Nota: En un entorno real, las contraseñas deben ir cifradas con bcrypt o similar)
INSERT INTO Usuario (nombre, apellidos, email, telefono, contrasena, direccion) VALUES
('Admin', 'GlobalMarket', 'admin@globalmarket.com', '600123456', 'hash_admin_123', 'Calle Principal 1, Madrid'),
('Juan', 'Pérez', 'juan.perez@email.com', '611222333', 'hash_juan_456', 'Avenida Libertad 5, Barcelona'),
('María', 'García', 'maria.garcia@email.com', '622333444', 'hash_maria_789', 'Plaza Mayor 10, Sevilla');
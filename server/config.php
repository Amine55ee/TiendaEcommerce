<?php

$host = 'localhost';
$dbname = 'globalmarket_db'; 
$user = $_GET["usuario"] ?? "root";           
$pass = $_GET["clave"] ?? "";               

try {
    // Configuración de la conexión PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    
    // Activar el reporte de errores y excepciones
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Configurar el modo de obtención de datos por defecto a un array asociativo
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    // En producción, es mejor registrar este error en un log y no mostrarlo al usuario
    http_response_code(500);
    die(json_encode(["error" => "Error de conexión a la base de datos"]));
}
?>
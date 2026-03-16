<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../config.php';

$metodo = $_SERVER['REQUEST_METHOD'];

// Manejar preflight request (CORS)
if ($metodo === 'OPTIONS') {
    http_response_code(200);
    exit();
}

switch ($metodo) {
    case 'POST':
        $datos = json_decode(file_get_contents("php://input"));
        $accion = $datos->accion ?? '';

        if ($accion === 'registro') {
            // REGISTRO DE USUARIO
            if (empty($datos->nombre) || empty($datos->email) || empty($datos->contrasena)) {
                http_response_code(400);
                echo json_encode(["mensaje" => "Faltan datos obligatorios"]);
                exit();
            }

            $hash = password_hash($datos->contrasena, PASSWORD_BCRYPT);

            try {
                $sql = "INSERT INTO Usuario (nombre, apellidos, email, telefono, contrasena, direccion) 
                        VALUES (:nombre, :apellidos, :email, :telefono, :contrasena, :direccion)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':nombre' => $datos->nombre,
                    ':apellidos' => $datos->apellidos ?? '',
                    ':email' => $datos->email,
                    ':telefono' => $datos->telefono ?? '',
                    ':contrasena' => $hash,
                    ':direccion' => $datos->direccion ?? ''
                ]);
                http_response_code(201);
                echo json_encode(["mensaje" => "Usuario registrado con éxito"]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["mensaje" => "Error al registrar: " . $e->getMessage()]);
            }

        } elseif ($accion === 'login') {
            // LOGIN DE USUARIO
            if (empty($datos->email) || empty($datos->contrasena)) {
                http_response_code(400);
                echo json_encode(["mensaje" => "Email y contraseña requeridos"]);
                exit();
            }

            $sql = "SELECT * FROM Usuario WHERE email = :email";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':email' => $datos->email]);
            $usuario = $stmt->fetch();

            if ($usuario && password_verify($datos->contrasena, $usuario['contrasena'])) {
                unset($usuario['contrasena']); // No devolver la contraseña al cliente
                http_response_code(200);
                echo json_encode(["mensaje" => "Login exitoso", "usuario" => $usuario]);
            } else {
                http_response_code(401);
                echo json_encode(["mensaje" => "Credenciales incorrectas"]);
            }
        }
        break;

    case 'GET':
        // LISTAR USUARIOS (O uno específico si se pasa id)
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT id_usuario, nombre, apellidos, email, telefono, direccion FROM Usuario WHERE id_usuario = :id");
            $stmt->execute([':id' => $id]);
            $resultado = $stmt->fetch();
        } else {
            $stmt = $pdo->query("SELECT id_usuario, nombre, apellidos, email, telefono, direccion FROM Usuario");
            $resultado = $stmt->fetchAll();
        }
        echo json_encode($resultado);
        break;

    case 'PUT':
        // ACTUALIZAR USUARIO
        $datos = json_decode(file_get_contents("php://input"));
        // Recoger el ID del cuerpo JSON de forma prioritaria
        $id = $datos->id_usuario ?? $_GET['id'] ?? null;

        if (!$id || empty($datos->nombre)) {
            http_response_code(400);
            echo json_encode(["mensaje" => "ID y datos a actualizar requeridos"]);
            exit();
        }

        try {
            $sql = "UPDATE Usuario SET nombre = :nombre, apellidos = :apellidos, telefono = :telefono, direccion = :direccion WHERE id_usuario = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':nombre' => $datos->nombre,
                ':apellidos' => $datos->apellidos ?? '',
                ':telefono' => $datos->telefono ?? '',
                ':direccion' => $datos->direccion ?? '',
                ':id' => $id
            ]);
            
            // Novedad: Devolver los nuevos datos para actualizar la interfaz
            $stmt = $pdo->prepare("SELECT id_usuario, nombre, apellidos, email, telefono, direccion FROM Usuario WHERE id_usuario = :id");
            $stmt->execute([':id' => $id]);
            $usuario_actualizado = $stmt->fetch();
            
            echo json_encode(["mensaje" => "Usuario actualizado", "usuario" => $usuario_actualizado]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["mensaje" => "Error al actualizar: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // BORRAR USUARIO
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["mensaje" => "ID de usuario requerido"]);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM Usuario WHERE id_usuario = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["mensaje" => "Usuario eliminado correctamente"]);
        } catch (PDOException $e) {
            http_response_code(500);
            // Si el usuario tiene carritos/pedidos asociados, la BD bloquea el borrado
            if ($e->getCode() == 23000) {
                echo json_encode(["mensaje" => "No se puede eliminar la cuenta. Tienes carritos o pedidos en curso."]);
            } else {
                echo json_encode(["mensaje" => "Error al eliminar: " . $e->getMessage()]);
            }
        }
        break;
}
?>
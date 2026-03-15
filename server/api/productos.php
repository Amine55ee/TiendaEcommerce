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
    case 'GET':
        // LEER: Obtener catálogo, filtrar por categoría o buscar un producto específico
        $id_producto = $_GET['id'] ?? null;
        $id_categoria = $_GET['categoria'] ?? null;

        try {
            if ($id_producto) {
                // Buscar un único producto por su ID
                $stmt = $pdo->prepare("SELECT * FROM Producto WHERE id_producto = :id");
                $stmt->execute([':id' => $id_producto]);
                $producto = $stmt->fetch();
                
                if ($producto) {
                    http_response_code(200);
                    echo json_encode($producto);
                } else {
                    http_response_code(404);
                    echo json_encode(["mensaje" => "Producto no encontrado"]);
                }
            } elseif ($id_categoria) {
                // Filtrar productos por su ID de categoría
                $stmt = $pdo->prepare("SELECT * FROM Producto WHERE id_categoria = :cat");
                $stmt->execute([':cat' => $id_categoria]);
                http_response_code(200);
                echo json_encode($stmt->fetchAll());
            } else {
                // Obtener todos los productos
                $stmt = $pdo->query("SELECT * FROM Producto");
                http_response_code(200);
                echo json_encode($stmt->fetchAll());
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["mensaje" => "Error al obtener productos: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        // CREAR: Añadir un nuevo producto al catálogo
        $datos = json_decode(file_get_contents("php://input"));
        
        // Validación de campos obligatorios
        if (empty($datos->nombre) || empty($datos->precio) || empty($datos->id_categoria)) {
            http_response_code(400);
            echo json_encode(["mensaje" => "Faltan datos obligatorios (nombre, precio, id_categoria)"]);
            exit();
        }

        try {
            $sql = "INSERT INTO Producto (nombre, descripcion, precio, stock, id_categoria) 
                    VALUES (:nombre, :descripcion, :precio, :stock, :id_categoria)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':nombre' => $datos->nombre,
                ':descripcion' => $datos->descripcion ?? null,
                ':precio' => $datos->precio,
                ':stock' => $datos->stock ?? 0,
                ':id_categoria' => $datos->id_categoria
            ]);
            
            http_response_code(201);
            echo json_encode([
                "mensaje" => "Producto creado exitosamente", 
                "id_producto" => $pdo->lastInsertId()
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["mensaje" => "Error al crear producto: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // ACTUALIZAR: Modificar la información de un producto existente
        $datos = json_decode(file_get_contents("php://input"));
        $id_producto = $_GET['id'] ?? null;

        if (!$id_producto) {
            http_response_code(400);
            echo json_encode(["mensaje" => "ID de producto requerido en la URL (?id=...)"]);
            exit();
        }

        if (empty($datos->nombre) || empty($datos->precio) || empty($datos->id_categoria)) {
            http_response_code(400);
            echo json_encode(["mensaje" => "Faltan datos obligatorios para actualizar"]);
            exit();
        }

        try {
            $sql = "UPDATE Producto 
                    SET nombre = :nombre, descripcion = :descripcion, precio = :precio, stock = :stock, id_categoria = :id_categoria 
                    WHERE id_producto = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':nombre' => $datos->nombre,
                ':descripcion' => $datos->descripcion ?? null,
                ':precio' => $datos->precio,
                ':stock' => $datos->stock ?? 0,
                ':id_categoria' => $datos->id_categoria,
                ':id' => $id_producto
            ]);
            
            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(["mensaje" => "Producto actualizado exitosamente"]);
            } else {
                http_response_code(404);
                echo json_encode(["mensaje" => "Producto no encontrado o los datos son iguales a los existentes"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["mensaje" => "Error al actualizar producto: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // BORRAR: Eliminar un producto del sistema
        $id_producto = $_GET['id'] ?? null;

        if (!$id_producto) {
            http_response_code(400);
            echo json_encode(["mensaje" => "ID de producto requerido en la URL (?id=...)"]);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM Producto WHERE id_producto = :id");
            $stmt->execute([':id' => $id_producto]);
            
            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(["mensaje" => "Producto eliminado exitosamente"]);
            } else {
                http_response_code(404);
                echo json_encode(["mensaje" => "Producto no encontrado"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["mensaje" => "Error al eliminar producto (puede que esté asociado a un pedido): " . $e->getMessage()]);
        }
        break;

    default:
        // Método no soportado
        http_response_code(405);
        echo json_encode(["mensaje" => "Método HTTP no permitido"]);
        break;
}
?>
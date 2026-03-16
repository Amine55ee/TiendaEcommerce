<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");

require_once '../config.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'POST':
        // AÑADIR PRODUCTO AL CARRITO
        $datos = json_decode(file_get_contents("php://input"));
        $id_usuario = $datos->id_usuario ?? null;
        $id_producto = $datos->id_producto ?? null;
        $cantidad = $datos->cantidad ?? 1; // Novedad: Recibir la cantidad

        if (!$id_usuario || !$id_producto) {
            http_response_code(400);
            echo json_encode(["mensaje" => "Falta id_usuario o id_producto"]);
            exit();
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("SELECT p.id_pedido FROM Pedido p JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'");
            $stmt->execute([':user' => $id_usuario]);
            $pedido = $stmt->fetch();

            $id_pedido = $pedido ? $pedido['id_pedido'] : null;

            if (!$id_pedido) {
                $stmt = $pdo->prepare("INSERT INTO Pedido (total, estado_pedido) VALUES (0, 'Pendiente')");
                $stmt->execute();
                $id_pedido = $pdo->lastInsertId();

                $stmt = $pdo->prepare("INSERT INTO Hace (id_usuario, id_pedido) VALUES (:user, :pedido)");
                $stmt->execute([':user' => $id_usuario, ':pedido' => $id_pedido]);
            }

            // Insertar la cantidad recibida o sumarla a la existente
            $sql_insert = "INSERT INTO Detalle_Pedido (id_pedido, id_producto, cantidad) 
                           VALUES (:pedido, :producto, :cantidad) 
                           ON DUPLICATE KEY UPDATE cantidad = cantidad + :cantidad_update";
            $stmt = $pdo->prepare($sql_insert);
            $stmt->execute([
                ':pedido' => $id_pedido, 
                ':producto' => $id_producto,
                ':cantidad' => $cantidad,
                ':cantidad_update' => $cantidad
            ]);

            $pdo->commit();
            echo json_encode(["mensaje" => "Producto añadido al carrito", "id_pedido" => $id_pedido]);

        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["mensaje" => "Error al procesar el carrito: " . $e->getMessage()]);
        }
        break;

    case 'GET':
        // VER CONTENIDO DEL CARRITO DEL USUARIO
        $id_usuario = $_GET['id_usuario'] ?? null;
        if (!$id_usuario) {
            http_response_code(400);
            echo json_encode(["mensaje" => "Se requiere id_usuario"]);
            exit();
        }

        // Obtener los productos del pedido pendiente del usuario y sus cantidades
        $sql = "SELECT prod.id_producto, prod.nombre, prod.precio, dp.cantidad 
                FROM Producto prod
                JOIN Detalle_Pedido dp ON prod.id_producto = dp.id_producto
                JOIN Pedido p ON dp.id_pedido = p.id_pedido
                JOIN Hace h ON p.id_pedido = h.id_pedido
                WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':user' => $id_usuario]);
        echo json_encode($stmt->fetchAll());
        break;
        
    case 'PUT':
        // ACTUALIZAR CANTIDAD EN EL CARRITO
        $datos = json_decode(file_get_contents("php://input"));
        $id_usuario = $datos->id_usuario ?? null;
        $id_producto = $datos->id_producto ?? null;
        $cantidad = $datos->cantidad ?? null;

        if (!$id_usuario || !$id_producto || $cantidad === null) {
            http_response_code(400);
            echo json_encode(["mensaje" => "Faltan datos para actualizar"]);
            exit();
        }

        try {
            // Buscar el pedido pendiente del usuario
            $stmt = $pdo->prepare("SELECT p.id_pedido FROM Pedido p JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'");
            $stmt->execute([':user' => $id_usuario]);
            $pedido = $stmt->fetch();

            if ($pedido) {
                // Actualizar la cantidad exacta en el detalle
                $stmt = $pdo->prepare("UPDATE Detalle_Pedido SET cantidad = :cant WHERE id_pedido = :pedido AND id_producto = :producto");
                $stmt->execute([':cant' => $cantidad, ':pedido' => $pedido['id_pedido'], ':producto' => $id_producto]);
                echo json_encode(["mensaje" => "Cantidad actualizada"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["mensaje" => "Error al actualizar: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // ELIMINAR UN PRODUCTO DEL CARRITO
        $id_usuario = $_GET['id_usuario'] ?? null;
        $id_producto = $_GET['id_producto'] ?? null;

        if (!$id_usuario || !$id_producto) {
            http_response_code(400);
            echo json_encode(["mensaje" => "Faltan datos para eliminar"]);
            exit();
        }

        try {
            $stmt = $pdo->prepare("SELECT p.id_pedido FROM Pedido p JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'");
            $stmt->execute([':user' => $id_usuario]);
            $pedido = $stmt->fetch();

            if ($pedido) {
                $stmt = $pdo->prepare("DELETE FROM Detalle_Pedido WHERE id_pedido = :pedido AND id_producto = :producto");
                $stmt->execute([':pedido' => $pedido['id_pedido'], ':producto' => $id_producto]);
                echo json_encode(["mensaje" => "Producto eliminado"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["mensaje" => "Error al eliminar: " . $e->getMessage()]);
        }
        break;
}
?>
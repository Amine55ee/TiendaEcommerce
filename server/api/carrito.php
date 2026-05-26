<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate"); 
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit();
}

require_once '../config.php';

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        $id_usuario = $_GET['id_usuario'] ?? null;
        $historial = $_GET['historial'] ?? null;
        
        if (!$id_usuario) {
            http_response_code(400); echo json_encode(["mensaje" => "Falta ID usuario"]); exit();
        }
        
        try {
            if ($historial) {
                $sql = "SELECT p.id_pedido, p.fecha_pedido, p.total, p.estado_pedido FROM Pedido p JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido != 'Pendiente' ORDER BY p.fecha_pedido DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':user' => $id_usuario]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            } else {
                $sql = "SELECT prod.id_producto, prod.nombre, prod.precio, dp.cantidad FROM Producto prod JOIN Detalle_Pedido dp ON prod.id_producto = dp.id_producto JOIN Pedido p ON dp.id_pedido = p.id_pedido JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':user' => $id_usuario]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
        } catch (Exception $e) {
            http_response_code(500); echo json_encode(["mensaje" => "Error SQL GET: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"));
        $id_usuario = $datos->id_usuario ?? null;
        $id_producto = $datos->id_producto ?? null;
        $cantidad = $datos->cantidad ?? 1;

        try {
            $pdo->beginTransaction();
            // Buscar carrito pendiente
            $stmt = $pdo->prepare("SELECT p.id_pedido FROM Pedido p JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'");
            $stmt->execute([':user' => $id_usuario]);
            $pedido = $stmt->fetch();
            
            if (!$pedido) {
                $stmtPedido = $pdo->prepare("INSERT INTO Pedido (total, estado_pedido) VALUES (0, 'Pendiente')");
                $stmtPedido->execute();
                $id_pedido = $pdo->lastInsertId();
                $stmtHace = $pdo->prepare("INSERT INTO Hace (id_usuario, id_pedido) VALUES (:user, :pedido)");
                $stmtHace->execute([':user' => $id_usuario, ':pedido' => $id_pedido]);
            } else {
                $id_pedido = $pedido['id_pedido'];
            }

            // CORRECCIÓN AQUÍ: Inserción simplificada
            $stmtCheck = $pdo->prepare("SELECT cantidad FROM Detalle_Pedido WHERE id_pedido = :pedido AND id_producto = :producto");
            $stmtCheck->execute([':pedido' => $id_pedido, ':producto' => $id_producto]);
            $detalle = $stmtCheck->fetch();

            if ($detalle) {
                $stmtUpdate = $pdo->prepare("UPDATE Detalle_Pedido SET cantidad = cantidad + :cant WHERE id_pedido = :pedido AND id_producto = :producto");
                $stmtUpdate->execute([':cant' => $cantidad, ':pedido' => $id_pedido, ':producto' => $id_producto]);
            } else {
                $stmtInsert = $pdo->prepare("INSERT INTO Detalle_Pedido (id_pedido, id_producto, cantidad) VALUES (:pedido, :producto, :cant)");
                $stmtInsert->execute([':pedido' => $id_pedido, ':producto' => $id_producto, ':cant' => $cantidad]);
            }
            
            $pdo->commit();
            echo json_encode(["mensaje" => "Producto añadido"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500); echo json_encode(["mensaje" => "Error SQL: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        $datos = json_decode(file_get_contents("php://input"));
        
        if (isset($datos->accion) && $datos->accion === 'pagar') {
            $id_usuario = $datos->id_usuario ?? null;
            if (!$id_usuario) {
                http_response_code(400); echo json_encode(["mensaje" => "Falta id_usuario para pagar"]); exit();
            }
            try {
                $pdo->beginTransaction();
                $stmt = $pdo->prepare("SELECT p.id_pedido FROM Pedido p JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'");
                $stmt->execute([':user' => $id_usuario]);
                $pedido = $stmt->fetch();

                if ($pedido) {
                    $stmtTotal = $pdo->prepare("SELECT SUM(dp.cantidad * p.precio) FROM Detalle_Pedido dp JOIN Producto p ON dp.id_producto = p.id_producto WHERE dp.id_pedido = :id");
                    $stmtTotal->execute([':id' => $pedido['id_pedido']]);
                    $total = $stmtTotal->fetchColumn() ?: 0;
                    $total_con_envio = $total > 0 ? $total + 5.00 : 0;

                    $stmtUpdate = $pdo->prepare("UPDATE Pedido SET estado_pedido = 'Enviado', total = :tot WHERE id_pedido = :id");
                    $stmtUpdate->execute([':tot' => $total_con_envio, ':id' => $pedido['id_pedido']]);

                    $stmtPago = $pdo->prepare("INSERT INTO Pago (id_pedido, metodo, estado_pago) VALUES (:id_pedido, 'Tarjeta', 'Completado')");
                    $stmtPago->execute([':id_pedido' => $pedido['id_pedido']]);

                    $pdo->commit();
                    echo json_encode(["mensaje" => "Pago procesado"]);
                } else {
                    $pdo->rollBack();
                    http_response_code(404); echo json_encode(["mensaje" => "No hay carrito activo"]);
                }
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500); echo json_encode(["mensaje" => "Error al pagar: " . $e->getMessage()]);
            }
            break;
        }

        $id_usuario = $datos->id_usuario ?? null;
        $id_producto = $datos->id_producto ?? null;
        $cantidad = $datos->cantidad ?? null;

        if (!$id_usuario || !$id_producto || $cantidad === null) {
            http_response_code(400); echo json_encode(["mensaje" => "Datos incompletos para actualizar"]); exit();
        }

        try {
            $stmt = $pdo->prepare("SELECT p.id_pedido FROM Pedido p JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'");
            $stmt->execute([':user' => $id_usuario]);
            $pedido = $stmt->fetch();

            if ($pedido) {
                $stmtUpdate = $pdo->prepare("UPDATE Detalle_Pedido SET cantidad = :cant WHERE id_pedido = :pedido AND id_producto = :prod");
                $stmtUpdate->execute([':cant' => $cantidad, ':pedido' => $pedido['id_pedido'], ':prod' => $id_producto]);
                echo json_encode(["mensaje" => "Cantidad actualizada"]);
            }
        } catch (Exception $e) {
            http_response_code(500); echo json_encode(["mensaje" => "Error PUT: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id_usuario = $_GET['id_usuario'] ?? null;
        $id_producto = $_GET['id_producto'] ?? null;

        if ($id_usuario && $id_producto) {
            try {
                $stmt = $pdo->prepare("SELECT p.id_pedido FROM Pedido p JOIN Hace h ON p.id_pedido = h.id_pedido WHERE h.id_usuario = :user AND p.estado_pedido = 'Pendiente'");
                $stmt->execute([':user' => $id_usuario]);
                $pedido = $stmt->fetch();

                if ($pedido) {
                    $stmtDel = $pdo->prepare("DELETE FROM Detalle_Pedido WHERE id_pedido = :pedido AND id_producto = :prod");
                    $stmtDel->execute([':pedido' => $pedido['id_pedido'], ':prod' => $id_producto]);
                    echo json_encode(["mensaje" => "Producto eliminado"]);
                }
            } catch (Exception $e) {
                http_response_code(500); echo json_encode(["mensaje" => "Error DELETE: " . $e->getMessage()]);
            }
        }
        break;
}
?>
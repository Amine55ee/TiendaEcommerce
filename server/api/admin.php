<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // 1. Calcular Ingresos Totales (Solo suma pedidos que ya han sido pagados/enviados)
        $stmtIngresos = $pdo->query("SELECT SUM(total) as total_ventas FROM Pedido WHERE estado_pedido IN ('Enviado', 'Entregado', 'Completado')");
        $ingresos = $stmtIngresos->fetch(PDO::FETCH_ASSOC)['total_ventas'] ?? 0;

        // 2. Contar Pedidos Finalizados
        $stmtPedidos = $pdo->query("SELECT COUNT(*) as total_pedidos FROM Pedido WHERE estado_pedido IN ('Enviado', 'Entregado', 'Completado')");
        $pedidos_count = $stmtPedidos->fetch(PDO::FETCH_ASSOC)['total_pedidos'] ?? 0;

        // 3. Contar Clientes Registrados (Se excluye al correo del administrador)
        $stmtUsuarios = $pdo->query("SELECT COUNT(*) as total_usuarios FROM Usuario WHERE email != 'admin@globalmarket.com'");
        $usuarios_count = $stmtUsuarios->fetch(PDO::FETCH_ASSOC)['total_usuarios'] ?? 0;

        // 4. Obtener el listado de los últimos 10 pedidos realizados en la plataforma
        $sqlUltimos = "
            SELECT p.id_pedido, p.fecha_pedido, p.total, p.estado_pedido, u.nombre, u.apellidos
            FROM Pedido p
            JOIN Hace h ON p.id_pedido = h.id_pedido
            JOIN Usuario u ON h.id_usuario = u.id_usuario
            ORDER BY p.fecha_pedido DESC
            LIMIT 10
        ";
        $stmtUltimos = $pdo->query($sqlUltimos);
        $ultimos_pedidos = $stmtUltimos->fetchAll(PDO::FETCH_ASSOC);

        // Enviar todos los datos empaquetados en JSON
        echo json_encode([
            "ingresos" => $ingresos,
            "pedidos_count" => $pedidos_count,
            "usuarios_count" => $usuarios_count,
            "ultimos_pedidos" => $ultimos_pedidos
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["mensaje" => "Error al obtener estadísticas: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["mensaje" => "Método no permitido"]);
}
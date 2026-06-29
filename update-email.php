<?php
$config = require __DIR__ . '/../api/config.php';
$db = $config['database'];
try {
    $pdo = new PDO("mysql:host={$db['host']};dbname={$db['dbname']};charset={$db['charset']}", $db['username'], $db['password']);
    $stmt = $pdo->prepare("UPDATE admins SET email = 'admin@blokestrips.com.au' WHERE email = 'admin@blokestrips.com'");
    $stmt->execute();
    echo json_encode(['ok' => true, 'rows_updated' => $stmt->rowCount()]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

<?php
$config = require __DIR__ . '/../api/config.php';
$db = $config['database'];
try {
    $pdo = new PDO("mysql:host={$db['host']};dbname={$db['dbname']};charset={$db['charset']}", $db['username'], $db['password']);
    $rows = $pdo->query("SELECT id, email, name FROM admins")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

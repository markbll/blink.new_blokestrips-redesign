<?php
$config = require __DIR__ . '/../api/config.php';
$db = $config['database'];
try {
    $pdo = new PDO("mysql:host={$db['host']};dbname={$db['dbname']};charset={$db['charset']}", $db['username'], $db['password']);
    $hash = password_hash('BlokesTrips#2026!Admin', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE email = 'admin@blokestrips.com'");
    $stmt->execute([$hash]);
    echo json_encode(['ok' => true, 'rows' => $stmt->rowCount(), 'verify' => password_verify('BlokesTrips#2026!Admin', $hash)]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

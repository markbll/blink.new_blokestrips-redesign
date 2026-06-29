<?php
$config = require __DIR__ . '/../api/config.php';
$db = $config['database'];
try {
    $pdo = new PDO("mysql:host={$db['host']};dbname={$db['dbname']};charset={$db['charset']}", $db['username'], $db['password']);
    $stmt = $pdo->prepare("SELECT password FROM admins WHERE email = 'admin@blokestrips.com.au'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $testPass = 'EGgzbrRdpABp';
    echo json_encode([
        'found'  => (bool)$row,
        'hash_prefix' => $row ? substr($row['password'], 0, 7) : null,
        'verify' => $row ? password_verify($testPass, $row['password']) : false,
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

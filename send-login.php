<?php
$config = require __DIR__ . '/../api/config.php';
$db = $config['database'];
$chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
$otp = '';
for ($i = 0; $i < 12; $i++) $otp .= $chars[random_int(0, strlen($chars) - 1)];
try {
    $pdo = new PDO("mysql:host={$db['host']};dbname={$db['dbname']};charset={$db['charset']}", $db['username'], $db['password']);
    $hash = password_hash($otp, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("UPDATE admins SET password = ? WHERE email = 'admin@blokestrips.com.au'");
    $stmt->execute([$hash]);
    if ($stmt->rowCount() === 0) die(json_encode(['error' => 'Admin not found']));
    $to = 'admin@blokestrips.com.au';
    $subject = 'BlokesTrips Admin — One-Time Login';
    $body = "Your one-time admin password:\n\nEmail:    admin@blokestrips.com.au\nPassword: {$otp}\n\nLogin: https://staging.blokestrips.com.au/admin\n\nChange your password after logging in.";
    $sent = mail($to, $subject, $body, "From: noreply@blokestrips.com.au");
    echo json_encode(['ok' => true, 'email_sent' => $sent, 'password' => $otp]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

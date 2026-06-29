<?php
// Simulate exactly what the frontend fetch does
$url = 'https://staging.blokestrips.com.au/api/admin/login';
$payload = json_encode(['email' => 'admin@blokestrips.com.au', 'password' => 'EGgzbrRdpABp']);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_SSL_VERIFYPEER => false,
]);
$body   = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error  = curl_error($ch);
curl_close($ch);

echo json_encode([
    'http_status' => $status,
    'curl_error'  => $error,
    'response'    => json_decode($body) ?? $body,
]);

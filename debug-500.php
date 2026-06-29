<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$autoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoload)) require_once $autoload;

spl_autoload_register(function ($class) {
    $prefix = 'BlokesTrips\\';
    $base = __DIR__ . '/src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $file = $base . str_replace('\\', '/', substr($class, $len)) . '.php';
    if (file_exists($file)) require $file;
});

use BlokesTrips\Controllers\AdminController;

try {
    $ctrl = new AdminController();
    $result = $ctrl->login(['email' => 'admin@blokestrips.com.au', 'password' => 'test']);
    echo json_encode(['result' => $result]);
} catch (Throwable $e) {
    echo json_encode(['error' => $e->getMessage(), 'file' => basename($e->getFile()), 'line' => $e->getLine()]);
}

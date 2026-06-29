<?php
$cleared = 0;
foreach (glob(sys_get_temp_dir() . '/login_attempts_*.json') as $file) {
    unlink($file);
    $cleared++;
}
echo json_encode(['ok' => true, 'files_cleared' => $cleared]);

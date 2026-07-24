<?php
/**
 * StreakUp Entry Point
 * Simple redirect to installer if not installed, otherwise serve index.html
 */

// Check if installation is complete
$installed = file_exists(__DIR__ . '/install.lock');

// If not installed, redirect to installer
if (!$installed) {
    header('Location: install.php');
    exit;
}

// If installed, serve index.html (React app)
header('Content-Type: text/html');
readfile(__DIR__ . '/index.html');
?>

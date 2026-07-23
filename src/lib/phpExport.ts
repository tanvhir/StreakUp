export const SQL_SCHEMA = `-- InfinityFree MySQL Database Schema for StreakUp App
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    avatar VARCHAR(255) DEFAULT '',
    bio TEXT,
    target_hours INT DEFAULT 8,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS study_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    cycle_date DATE NOT NULL,
    study_minutes INT NOT NULL,
    private_message TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY user_cycle (user_id, cycle_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mentor_feedback (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    admin_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notices (
    id VARCHAR(64) PRIMARY KEY,
    content TEXT NOT NULL,
    active TINYINT(1) DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS thread_posts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) DEFAULT '',
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS thread_comments (
    id VARCHAR(64) PRIMARY KEY,
    thread_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES thread_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const CONFIG_PHP = `<?php
// InfinityFree Database Configuration
define('DB_HOST', 'sqlxxx.epizy.com'); // Replace with your InfinityFree MySQL Hostname
define('DB_USER', 'epiz_xxx');         // Replace with your InfinityFree MySQL Username
define('DB_PASS', 'your_password');     // Replace with your InfinityFree MySQL Password
define('DB_NAME', 'epiz_xxx_streakup'); // Replace with your InfinityFree MySQL Database Name

function getDBConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
        exit;
    }
}
?>`;

export const DB_SETUP_PHP = `<?php
// InfinityFree Auto-Setup Installer Script
require_once 'config.php';

header('Content-Type: application/json');

try {
    $pdo = getDBConnection();

    // Run SQL Table Creation
    $sql = "
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student',
        avatar VARCHAR(255) DEFAULT '',
        bio TEXT,
        target_hours INT DEFAULT 8,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS study_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        cycle_date DATE NOT NULL,
        study_minutes INT NOT NULL,
        private_message TEXT,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_cycle (user_id, cycle_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS mentor_feedback (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        admin_id VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS notices (
        id VARCHAR(64) PRIMARY KEY,
        content TEXT NOT NULL,
        active TINYINT(1) DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS thread_posts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) DEFAULT '',
        content TEXT NOT NULL,
        likes_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS thread_comments (
        id VARCHAR(64) PRIMARY KEY,
        thread_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";

    $pdo->exec($sql);

    // Insert Default Admin User if not exists (email: admin@streakup.com, pass: admin123)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'admin@streakup.com'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $adminId = 'admin_' . time();
        $adminPass = password_hash('admin123', PASSWORD_BCRYPT);
        $insertAdmin = $pdo->prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, 'Admin Mentor', 'admin@streakup.com', ?, 'admin')");
        $insertAdmin->execute([$adminId, $adminPass]);
    }

    echo json_encode([
        "success" => true,
        "message" => "Database auto-setup completed successfully on InfinityFree! Default Admin Email: admin@streakup.com | Password: admin123"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Setup failed: " . $e->getMessage()
    ]);
}
?>`;

export const API_PHP = `<?php
// API Handler for InfinityFree Backend
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$pdo = getDBConnection();
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'register':
        $email = trim(strtolower($input['email'] ?? ''));
        $name = trim($input['name'] ?? '');
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? 'student';
        
        if (!$email || !$name || !$password) {
            echo json_encode(["error" => "Name, email, and password required"]);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(["error" => "Email already exists"]);
            exit;
        }
        
        $userId = 'u_' . uniqid();
        $passHash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $name, $email, $passHash, $role]);
        
        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $userId,
                "name" => $name,
                "email" => $email,
                "role" => $role
            ]
        ]);
        break;

    case 'login':
        $email = trim(strtolower($input['email'] ?? ''));
        $password = $input['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            echo json_encode(["error" => "Invalid email or password"]);
            exit;
        }
        
        unset($user['password_hash']);
        echo json_encode(["success" => true, "user" => $user]);
        break;

    case 'add_log':
        $userId = $input['userId'] ?? '';
        $cycleDate = $input['cycleDate'] ?? '';
        $studyMinutes = intval($input['studyMinutes'] ?? 0);
        $privateMessage = $input['privateMessage'] ?? '';
        
        if (!$userId || !$cycleDate) {
            echo json_encode(["error" => "User ID and Cycle Date required"]);
            exit;
        }
        
        $logId = 'log_' . uniqid();
        $stmt = $pdo->prepare("INSERT INTO study_logs (id, user_id, cycle_date, study_minutes, private_message) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE study_minutes = ?, private_message = ?");
        $stmt->execute([$logId, $userId, $cycleDate, $studyMinutes, $privateMessage, $studyMinutes, $privateMessage]);
        
        echo json_encode(["success" => true]);
        break;

    case 'get_leaderboard':
        // Return users + logs + mentor feedback
        $usersStmt = $pdo->query("SELECT id, name, email, role, avatar FROM users WHERE role = 'student'");
        $users = $usersStmt->fetchAll();
        
        $logsStmt = $pdo->query("SELECT * FROM study_logs ORDER BY cycle_date ASC");
        $logs = $logsStmt->fetchAll();
        
        $feedbackStmt = $pdo->query("SELECT * FROM mentor_feedback");
        $feedbacks = $feedbackStmt->fetchAll();
        
        echo json_encode([
            "users" => $users,
            "logs" => $logs,
            "feedbacks" => $feedbacks
        ]);
        break;

    default:
        echo json_encode(["status" => "StreakUp InfinityFree API Active"]);
        break;
}
?>`;

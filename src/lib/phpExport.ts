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

export function generateConfigPhp(dbHost = 'sql305.infinityfree.com', dbName = 'if0_42480076_streakup', dbUser = '', dbPass = '') {
  return `<?php
// InfinityFree Database Configuration
define('DB_HOST', '${dbHost}');
define('DB_NAME', '${dbName}');
define('DB_USER', '${dbUser}');
define('DB_PASS', '${dbPass}');

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
}

export function generateInstallPhp(
  dbHost = 'sql305.infinityfree.com',
  dbName = 'if0_42480076_streakup',
  dbUser = '',
  dbPass = '',
  adminName = 'Tanvir (Mentor)',
  adminEmail = 'mailtanvir26@gmail.com',
  adminPass = 'admin123'
) {
  return `<?php
// install.php - Auto-Installer & DB Setup Script for InfinityFree
if (file_exists('install.lock')) {
    die("<h1>Installer Locked</h1><p>The application is already installed. To re-run setup, delete the <code>install.lock</code> file from your server.</p><a href='index.html'>Go to App</a>");
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' || isset($_GET['auto'])) {
    $dbHost = trim($_POST['db_host'] ?? $_GET['db_host'] ?? '${dbHost}');
    $dbName = trim($_POST['db_name'] ?? $_GET['db_name'] ?? '${dbName}');
    $dbUser = trim($_POST['db_user'] ?? $_GET['db_user'] ?? '${dbUser}');
    $dbPass = $_POST['db_pass'] ?? $_GET['db_pass'] ?? '${dbPass}';
    
    $adminName = trim($_POST['admin_name'] ?? $_GET['admin_name'] ?? '${adminName}');
    $adminEmail = trim(strtolower($_POST['admin_email'] ?? $_GET['admin_email'] ?? '${adminEmail}'));
    $adminPassword = $_POST['admin_pass'] ?? $_GET['admin_pass'] ?? '${adminPass}';

    try {
        // 1. Connection Test
        $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        // 2. Execute Table Creation Queries
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
            UNIQUE KEY idx_user_cycle (user_id, cycle_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS mentor_feedback (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) UNIQUE NOT NULL,
            admin_id VARCHAR(64) NOT NULL,
            content TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

        // 3. Insert Admin User Account
        $adminId = 'usr_admin_' . time();
        $hash = password_hash($adminPassword, PASSWORD_BCRYPT);
        
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$adminEmail]);
        if (!$stmt->fetch()) {
            $insert = $pdo->prepare("INSERT INTO users (id, name, email, password_hash, role, bio) VALUES (?, ?, ?, ?, 'admin', 'Lead Mentor')");
            $insert->execute([$adminId, $adminName, $adminEmail, $hash]);
        }

        // 4. Write config.php
        $configCode = "<?php\\n" .
            "define('DB_HOST', '$dbHost');\\n" .
            "define('DB_NAME', '$dbName');\\n" .
            "define('DB_USER', '$dbUser');\\n" .
            "define('DB_PASS', '$dbPass');\\n" .
            "function getDBConnection() {\\n" .
            "    return new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);\\n" .
            "}\\n?>";
        file_put_contents('config.php', $configCode);

        // 5. Create install.lock
        file_put_contents('install.lock', date('Y-m-d H:i:s') . " - Installed successfully");

        $success = "Database configured & Admin account ($adminEmail) created! Redirecting to app...";
        if (isset($_GET['auto'])) {
            header('Content-Type: application/json');
            echo json_encode(["success" => true, "message" => $success]);
            exit;
        }
        header("refresh:2;url=index.html");
    } catch (Exception $e) {
        $error = "Setup Failed: " . $e->getMessage();
        if (isset($_GET['auto'])) {
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode(["error" => $error]);
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>StreakUp - InfinityFree Auto Setup</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: #0f172a; }
        p { font-size: 13px; color: #64748b; margin-bottom: 24px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; color: #334155; }
        input { width: 100%; padding: 10px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #059669; color: #ffffff; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-top: 12px; }
        button:hover { background: #047857; }
        .alert { padding: 12px; font-size: 13px; border-radius: 8px; margin-bottom: 16px; }
        .alert-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .section-title { font-size: 13px; font-weight: 800; color: #047857; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔥 StreakUp InfinityFree Installer</h1>
        <p>Enter your MySQL Database credentials and your Mentor/Admin details below to auto-configure your database tables.</p>

        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="alert alert-success"><?php echo htmlspecialchars($success); ?></div>
        <?php else: ?>
            <form method="POST">
                <div class="section-title">1. MySQL Database Connection</div>
                <div class="form-group">
                    <label>MySQL Hostname</label>
                    <input type="text" name="db_host" value="<?php echo htmlspecialchars($_POST['db_host'] ?? '${dbHost}'); ?>" required>
                </div>
                <div class="form-group">
                    <label>Database Name</label>
                    <input type="text" name="db_name" value="<?php echo htmlspecialchars($_POST['db_name'] ?? '${dbName}'); ?>" required>
                </div>
                <div class="form-group">
                    <label>Database Username</label>
                    <input type="text" name="db_user" value="<?php echo htmlspecialchars($_POST['db_user'] ?? '${dbUser}'); ?>" placeholder="e.g. if0_42480076" required>
                </div>
                <div class="form-group">
                    <label>Database Password</label>
                    <input type="password" name="db_pass" value="<?php echo htmlspecialchars($_POST['db_pass'] ?? '${dbPass}'); ?>" placeholder="Your vPanel MySQL Password">
                </div>

                <div class="section-title">2. Mentor / Admin Account Details</div>
                <div class="form-group">
                    <label>Mentor Name</label>
                    <input type="text" name="admin_name" value="<?php echo htmlspecialchars($_POST['admin_name'] ?? '${adminName}'); ?>" required>
                </div>
                <div class="form-group">
                    <label>Mentor Email</label>
                    <input type="email" name="admin_email" value="<?php echo htmlspecialchars($_POST['admin_email'] ?? '${adminEmail}'); ?>" required>
                </div>
                <div class="form-group">
                    <label>Mentor Password</label>
                    <input type="password" name="admin_pass" value="<?php echo htmlspecialchars($_POST['admin_pass'] ?? '${adminPass}'); ?>" required>
                </div>

                <button type="submit">Run Auto Setup & Lock Installer</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>`;
}

export function generateApiPhp() {
  return `<?php
// api.php - API Handler for InfinityFree Backend
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
    case 'status':
        $configured = false;
        try {
            $pdo = getDBConnection();
            $configured = true;
        } catch (Exception $e) {}
        echo json_encode([
            "configured" => $configured,
            "dbHost" => defined('DB_HOST') ? DB_HOST : '',
            "dbName" => defined('DB_NAME') ? DB_NAME : '',
            "dbUser" => defined('DB_USER') ? DB_USER : ''
        ]);
        break;

    case 'register':
        $email = trim(strtolower($input['email'] ?? ''));
        $name = trim($input['name'] ?? '');
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? 'student';
        
        if (!$email || !$name) {
            echo json_encode(["error" => "Name and email required"]);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(["error" => "Email already exists"]);
            exit;
        }
        
        $userId = 'u_' . uniqid();
        $passHash = password_hash($password ?: 'student123', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (id, name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?, ?)");
        $avatar = "https://api.dicebear.com/7.x/bottts/svg?seed=" . urlencode($name);
        $stmt->execute([$userId, $name, $email, $passHash, $role, $avatar]);
        
        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $userId,
                "name" => $name,
                "email" => $email,
                "role" => $role,
                "avatar" => $avatar,
                "createdAt" => date('Y-m-d H:i:s')
            ]
        ]);
        break;

    case 'login':
        $email = trim(strtolower($input['email'] ?? $input['username'] ?? ''));
        $password = $input['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            echo json_encode(["error" => "Account not found"]);
            exit;
        }
        
        unset($user['password_hash']);
        echo json_encode(["success" => true, "user" => $user]);
        break;

    case 'update_profile':
        $userId = $input['userId'] ?? '';
        $name = trim($input['name'] ?? '');
        $bio = trim($input['bio'] ?? '');
        $targetHours = intval($input['targetHoursPerDay'] ?? 8);
        $avatar = $input['avatar'] ?? '';
        
        if (!$userId || !$name) {
            echo json_encode(["error" => "User ID and name required"]);
            exit;
        }
        
        $stmt = $pdo->prepare("UPDATE users SET name = ?, bio = ?, target_hours = ?, avatar = ? WHERE id = ?");
        $stmt->execute([$name, $bio, $targetHours, $avatar, $userId]);
        
        echo json_encode(["success" => true, "message" => "Profile updated"]);
        break;

    case 'add_log':
        $userId = $input['userId'] ?? '';
        $hours = intval($input['hours'] ?? 0);
        $minutes = intval($input['minutes'] ?? 0);
        $studyMinutes = $hours * 60 + $minutes;
        $cycleDate = $input['cycleDate'] ?? date('Y-m-d');
        $privateMessage = $input['privateMessage'] ?? '';
        
        if (!$userId) {
            echo json_encode(["error" => "User ID required"]);
            exit;
        }
        
        $logId = 'log_' . uniqid();
        $stmt = $pdo->prepare("INSERT INTO study_logs (id, user_id, cycle_date, study_minutes, private_message) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE study_minutes = ?, private_message = ?");
        $stmt->execute([$logId, $userId, $cycleDate, $studyMinutes, $privateMessage, $studyMinutes, $privateMessage]);
        
        echo json_encode(["success" => true]);
        break;

    case 'get_user_logs':
        $userId = $_GET['userId'] ?? $input['userId'] ?? '';
        if (!$userId) {
            echo json_encode(["error" => "User ID required"]);
            exit;
        }
        $stmt = $pdo->prepare("SELECT id, user_id as userId, cycle_date as cycleDate, study_minutes as studyMinutes, private_message as privateMessage, logged_at as loggedAt FROM study_logs WHERE user_id = ? ORDER BY cycle_date DESC");
        $stmt->execute([$userId]);
        $logs = $stmt->fetchAll();
        echo json_encode(["success" => true, "logs" => $logs]);
        break;

    case 'get_leaderboard':
        $usersStmt = $pdo->query("SELECT id, name, email, role, avatar, bio, target_hours as targetHoursPerDay, created_at as createdAt FROM users WHERE role = 'student'");
        $users = $usersStmt->fetchAll();
        
        $logsStmt = $pdo->query("SELECT id, user_id as userId, cycle_date as cycleDate, study_minutes as studyMinutes, private_message as privateMessage, logged_at as loggedAt FROM study_logs ORDER BY cycle_date ASC");
        $logs = $logsStmt->fetchAll();
        
        $feedbackStmt = $pdo->query("SELECT id, user_id as userId, admin_id as adminId, content, updated_at as updatedAt FROM mentor_feedback");
        $feedbacks = $feedbackStmt->fetchAll();
        
        echo json_encode([
            "success" => true,
            "users" => $users,
            "logs" => $logs,
            "feedbacks" => $feedbacks
        ]);
        break;

    case 'add_feedback':
        $studentId = $input['studentId'] ?? '';
        $adminId = $input['adminId'] ?? 'admin';
        $content = trim($input['content'] ?? '');
        if (!$studentId || !$content) {
            echo json_encode(["error" => "Student ID and content required"]);
            exit;
        }
        $id = 'fb_' . uniqid();
        $stmt = $pdo->prepare("INSERT INTO mentor_feedback (id, user_id, admin_id, content) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE content = ?, admin_id = ?");
        $stmt->execute([$id, $studentId, $adminId, $content, $content, $adminId]);
        echo json_encode(["success" => true, "message" => "Feedback submitted"]);
        break;

    case 'get_notices':
        $stmt = $pdo->query("SELECT id, content, active, updated_at as updatedAt, updated_by as updatedBy FROM notices WHERE active = 1 ORDER BY updated_at DESC LIMIT 1");
        $notice = $stmt->fetch();
        echo json_encode(["success" => true, "notice" => $notice ? [
            "id" => $notice['id'],
            "content" => $notice['content'],
            "active" => (bool)$notice['active'],
            "updatedAt" => $notice['updatedAt'],
            "updatedBy" => $notice['updatedBy']
        ] : null]);
        break;

    case 'update_notice':
        $content = trim($input['content'] ?? '');
        $userId = trim($input['userId'] ?? 'admin');
        if (!$content) {
            echo json_encode(["error" => "Content required"]);
            exit;
        }
        $id = 'notice_' . uniqid();
        $pdo->exec("UPDATE notices SET active = 0");
        $stmt = $pdo->prepare("INSERT INTO notices (id, content, active, updated_by) VALUES (?, ?, 1, ?)");
        $stmt->execute([$id, $content, $userId]);
        echo json_encode(["success" => true, "notice" => [
            "id" => $id,
            "content" => $content,
            "active" => true,
            "updatedAt" => date('Y-m-d H:i:s'),
            "updatedBy" => $userId
        ]]);
        break;

    case 'get_threads':
        $threadsStmt = $pdo->query("
            SELECT t.*, u.name as userName, u.avatar as userAvatar, u.role as userRole 
            FROM thread_posts t 
            LEFT JOIN users u ON t.user_id = u.id 
            ORDER BY t.created_at DESC
        ");
        $threads = $threadsStmt->fetchAll();
        
        $threadList = [];
        foreach ($threads as $t) {
            $commentsStmt = $pdo->prepare("
                SELECT c.*, u.name as userName, u.avatar as userAvatar, u.role as userRole 
                FROM thread_comments c 
                LEFT JOIN users u ON c.user_id = u.id 
                WHERE c.thread_id = ? 
                ORDER BY c.created_at ASC
            ");
            $commentsStmt->execute([$t['id']]);
            $comments = $commentsStmt->fetchAll();
            
            $commentsList = [];
            foreach ($comments as $c) {
                $commentsList[] = [
                    "id" => $c['id'],
                    "threadId" => $c['thread_id'],
                    "userId" => $c['user_id'],
                    "userName" => $c['userName'],
                    "userAvatar" => $c['userAvatar'],
                    "userRole" => $c['userRole'],
                    "content" => $c['content'],
                    "createdAt" => $c['created_at']
                ];
            }
            
            $threadList[] = [
                "id" => $t['id'],
                "userId" => $t['user_id'],
                "userName" => $t['userName'],
                "userAvatar" => $t['userAvatar'],
                "userRole" => $t['userRole'],
                "title" => $t['title'],
                "content" => $t['content'],
                "likesCount" => (int)$t['likes_count'],
                "likedBy" => [],
                "comments" => $commentsList,
                "createdAt" => $t['created_at']
            ];
        }
        echo json_encode(["success" => true, "threads" => $threadList]);
        break;

    case 'like_thread':
        $threadId = $_GET['threadId'] ?? $input['threadId'] ?? '';
        if (!$threadId) {
            echo json_encode(["error" => "Thread ID required"]);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE thread_posts SET likes_count = likes_count + 1 WHERE id = ?");
        $stmt->execute([$threadId]);
        
        $stmt = $pdo->prepare("SELECT likes_count FROM thread_posts WHERE id = ?");
        $stmt->execute([$threadId]);
        $thread = $stmt->fetch();
        echo json_encode(["success" => true, "likesCount" => (int)$thread['likes_count'], "likedBy" => []]);
        break;

    case 'add_comment':
        $threadId = $_GET['threadId'] ?? $input['threadId'] ?? '';
        $userId = $input['userId'] ?? '';
        $content = trim($input['content'] ?? '');
        if (!$threadId || !$userId || !$content) {
            echo json_encode(["error" => "Required fields missing"]);
            exit;
        }
        
        $id = 'cm_' . uniqid();
        $stmt = $pdo->prepare("INSERT INTO thread_comments (id, thread_id, user_id, content) VALUES (?, ?, ?, ?)");
        $stmt->execute([$id, $threadId, $userId, $content]);
        
        $stmt = $pdo->prepare("SELECT name, avatar, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        echo json_encode([
            "success" => true,
            "comment" => [
                "id" => $id,
                "threadId" => $threadId,
                "userId" => $userId,
                "userName" => $user ? $user['name'] : 'Unknown',
                "userAvatar" => $user ? $user['avatar'] : '',
                "userRole" => $user ? $user['role'] : 'student',
                "content" => $content,
                "createdAt" => date('Y-m-d H:i:s')
            ]
        ]);
        break;

    default:
        echo json_encode(["status" => "active", "message" => "StreakUp InfinityFree API Active"]);
        break;
}
?>`;
}

// Default export compatibility
export const CONFIG_PHP = generateConfigPhp();
export const DB_SETUP_PHP = generateInstallPhp();
export const API_PHP = generateApiPhp();

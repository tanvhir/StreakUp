<?php
/**
 * StreakUp Auto Installer Wizard
 * First-visit installation system for InfinityFree hosting
 */

session_start();
$error = '';
$success = '';
$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;

// Check if already installed
if (file_exists(__DIR__ . '/config.php') && file_exists(__DIR__ . '/install.lock')) {
    $installed = true;
} else {
    $installed = false;
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($step === 1) {
        // Database configuration step
        $dbHost = trim($_POST['db_host'] ?? '');
        $dbName = trim($_POST['db_name'] ?? '');
        $dbUser = trim($_POST['db_user'] ?? '');
        $dbPass = trim($_POST['db_pass'] ?? '');
        
        if (empty($dbHost) || empty($dbName) || empty($dbUser)) {
            $error = 'Database Host, Name, and Username are required.';
        } else {
            // Test database connection
            try {
                $conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
                if ($conn->connect_error) {
                    $error = 'Database connection failed: ' . $conn->connect_error;
                } else {
                    // Connection successful, save to session
                    $_SESSION['install_db'] = [
                        'host' => $dbHost,
                        'name' => $dbName,
                        'user' => $dbUser,
                        'pass' => $dbPass
                    ];
                    $conn->close();
                    header('Location: install.php?step=2');
                    exit;
                }
            } catch (Exception $e) {
                $error = 'Database error: ' . $e->getMessage();
            }
        }
    } elseif ($step === 2) {
        // Admin account setup step
        $adminName = trim($_POST['admin_name'] ?? '');
        $adminEmail = trim($_POST['admin_email'] ?? '');
        $adminPass = trim($_POST['admin_pass'] ?? '');
        
        if (empty($adminName) || empty($adminEmail) || empty($adminPass)) {
            $error = 'All admin fields are required.';
        } elseif (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
            $error = 'Invalid email address.';
        } elseif (strlen($adminPass) < 6) {
            $error = 'Password must be at least 6 characters.';
        } else {
            // Save admin details to session
            $_SESSION['install_admin'] = [
                'name' => $adminName,
                'email' => $adminEmail,
                'pass' => password_hash($adminPass, PASSWORD_DEFAULT)
            ];
            header('Location: install.php?step=3');
            exit;
        }
    } elseif ($step === 3) {
        // Final installation step
        if (!isset($_SESSION['install_db']) || !isset($_SESSION['install_admin'])) {
            $error = 'Installation session expired. Please start over.';
            session_destroy();
            header('Location: install.php');
            exit;
        }
        
        $db = $_SESSION['install_db'];
        $admin = $_SESSION['install_admin'];
        
        try {
            // Create database connection
            $conn = new mysqli($db['host'], $db['user'], $db['pass'], $db['name']);
            if ($conn->connect_error) {
                throw new Exception('Database connection failed: ' . $conn->connect_error);
            }
            
            // Create tables
            $sql = "
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    username VARCHAR(50) UNIQUE,
                    password VARCHAR(255),
                    role ENUM('admin', 'student') DEFAULT 'student',
                    avatar TEXT,
                    bio TEXT,
                    target_hours_per_day INT DEFAULT 8,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS study_logs (
                    id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    user_name VARCHAR(100) NOT NULL,
                    cycle_date DATE NOT NULL,
                    study_minutes INT NOT NULL,
                    study_hours_formatted VARCHAR(20) NOT NULL,
                    private_message TEXT,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    streak_count_at_log INT DEFAULT 0,
                    meets_streak_criteria BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS mentor_feedbacks (
                    id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    admin_id VARCHAR(50),
                    admin_name VARCHAR(100),
                    content TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS notices (
                    id VARCHAR(50) PRIMARY KEY,
                    content TEXT NOT NULL,
                    active BOOLEAN DEFAULT TRUE,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    updated_by VARCHAR(100)
                );
                
                CREATE TABLE IF NOT EXISTS threads (
                    id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    user_name VARCHAR(100) NOT NULL,
                    user_avatar TEXT,
                    user_role ENUM('admin', 'student') DEFAULT 'student',
                    title VARCHAR(200),
                    content TEXT NOT NULL,
                    likes_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS thread_comments (
                    id VARCHAR(50) PRIMARY KEY,
                    thread_id VARCHAR(50) NOT NULL,
                    user_id VARCHAR(50) NOT NULL,
                    user_name VARCHAR(100) NOT NULL,
                    user_avatar TEXT,
                    user_role ENUM('admin', 'student') DEFAULT 'student',
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS thread_likes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    thread_id VARCHAR(50) NOT NULL,
                    user_id VARCHAR(50) NOT NULL,
                    UNIQUE KEY unique_like (thread_id, user_id),
                    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            ";
            
            if ($conn->multi_query($sql)) {
                do {
                    if ($res = $conn->store_result()) {
                        $res->free();
                    }
                } while ($conn->more_results() && $conn->next_result());
            }
            
            // Insert default notice
            $noticeSql = "INSERT INTO notices (id, content, active, updated_by) VALUES ('notice_1', '📢 Welcome Students! 5:00 AM cycle update: Log study hours before 5 AM daily to keep your streak alive! Target 9+ hours for instant streak level-up!', TRUE, 'System')";
            $conn->query($noticeSql);
            
            // Insert admin user
            $adminId = 'usr_admin_' . time();
            $adminSql = "INSERT INTO users (id, name, email, password, role, avatar, bio, target_hours_per_day) VALUES (?, ?, ?, ?, 'admin', ?, ?, 10)";
            $stmt = $conn->prepare($adminSql);
            $avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($admin['name']);
            $bio = 'Lead Mentor & Coach';
            $stmt->bind_param('ssssss', $adminId, $admin['name'], $admin['email'], $admin['pass'], $avatar, $bio);
            $stmt->execute();
            $stmt->close();
            
            // Write config.php
            $configContent = "<?php
define('DB_HOST', '{$db['host']}');
define('DB_NAME', '{$db['name']}');
define('DB_USER', '{$db['user']}');
define('DB_PASS', '{$db['pass']}');

\$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if (\$conn->connect_error) {
    die('Database connection failed: ' . \$conn->connect_error);
}
\$conn->set_charset('utf8mb4');
";
            file_put_contents(__DIR__ . '/config.php', $configContent);
            
            // Create install.lock
            file_put_contents(__DIR__ . '/install.lock', date('Y-m-d H:i:s'));
            
            $conn->close();
            
            // Clear session
            session_destroy();
            
            $success = 'Installation completed successfully!';
            header('Location: index.php');
            exit;
            
        } catch (Exception $e) {
            $error = 'Installation failed: ' . $e->getMessage();
        }
    }
}

// Auto-install mode (for GitHub Actions)
if (isset($_GET['auto']) && $_GET['auto'] === '1' && !$installed) {
    // Check for environment variables or POST data
    $dbHost = getenv('DB_HOST') ?: ($_POST['db_host'] ?? '');
    $dbName = getenv('DB_NAME') ?: ($_POST['db_name'] ?? '');
    $dbUser = getenv('DB_USER') ?: ($_POST['db_user'] ?? '');
    $dbPass = getenv('DB_PASS') ?: ($_POST['db_pass'] ?? '');
    $adminName = getenv('ADMIN_NAME') ?: ($_POST['admin_name'] ?? 'Admin');
    $adminEmail = getenv('ADMIN_EMAIL') ?: ($_POST['admin_email'] ?? 'admin@example.com');
    $adminPass = getenv('ADMIN_PASS') ?: ($_POST['admin_pass'] ?? 'admin123');
    
    if ($dbHost && $dbName && $dbUser) {
        // Perform auto-install
        try {
            $conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
            if ($conn->connect_error) {
                die('AUTO-INSTALL FAILED: Database connection failed - ' . $conn->connect_error);
            }
            
            // Create tables (same SQL as above)
            $sql = "
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    username VARCHAR(50) UNIQUE,
                    password VARCHAR(255),
                    role ENUM('admin', 'student') DEFAULT 'student',
                    avatar TEXT,
                    bio TEXT,
                    target_hours_per_day INT DEFAULT 8,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS study_logs (
                    id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    user_name VARCHAR(100) NOT NULL,
                    cycle_date DATE NOT NULL,
                    study_minutes INT NOT NULL,
                    study_hours_formatted VARCHAR(20) NOT NULL,
                    private_message TEXT,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    streak_count_at_log INT DEFAULT 0,
                    meets_streak_criteria BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS mentor_feedbacks (
                    id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    admin_id VARCHAR(50),
                    admin_name VARCHAR(100),
                    content TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS notices (
                    id VARCHAR(50) PRIMARY KEY,
                    content TEXT NOT NULL,
                    active BOOLEAN DEFAULT TRUE,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    updated_by VARCHAR(100)
                );
                
                CREATE TABLE IF NOT EXISTS threads (
                    id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    user_name VARCHAR(100) NOT NULL,
                    user_avatar TEXT,
                    user_role ENUM('admin', 'student') DEFAULT 'student',
                    title VARCHAR(200),
                    content TEXT NOT NULL,
                    likes_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS thread_comments (
                    id VARCHAR(50) PRIMARY KEY,
                    thread_id VARCHAR(50) NOT NULL,
                    user_id VARCHAR(50) NOT NULL,
                    user_name VARCHAR(100) NOT NULL,
                    user_avatar TEXT,
                    user_role ENUM('admin', 'student') DEFAULT 'student',
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS thread_likes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    thread_id VARCHAR(50) NOT NULL,
                    user_id VARCHAR(50) NOT NULL,
                    UNIQUE KEY unique_like (thread_id, user_id),
                    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            ";
            
            if ($conn->multi_query($sql)) {
                do {
                    if ($res = $conn->store_result()) {
                        $res->free();
                    }
                } while ($conn->more_results() && $conn->next_result());
            }
            
            // Insert default notice
            $noticeSql = "INSERT INTO notices (id, content, active, updated_by) VALUES ('notice_1', '📢 Welcome Students! 5:00 AM cycle update: Log study hours before 5 AM daily to keep your streak alive! Target 9+ hours for instant streak level-up!', TRUE, 'System')";
            $conn->query($noticeSql);
            
            // Insert admin user
            $adminId = 'usr_admin_' . time();
            $adminSql = "INSERT INTO users (id, name, email, password, role, avatar, bio, target_hours_per_day) VALUES (?, ?, ?, ?, 'admin', ?, ?, 10)";
            $stmt = $conn->prepare($adminSql);
            $avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($adminName);
            $bio = 'Lead Mentor & Coach';
            $hashedPass = password_hash($adminPass, PASSWORD_DEFAULT);
            $stmt->bind_param('ssssss', $adminId, $adminName, $adminEmail, $hashedPass, $avatar, $bio);
            $stmt->execute();
            $stmt->close();
            
            // Write config.php
            $configContent = "<?php
define('DB_HOST', '{$dbHost}');
define('DB_NAME', '{$dbName}');
define('DB_USER', '{$dbUser}');
define('DB_PASS', '{$dbPass}');

\$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if (\$conn->connect_error) {
    die('Database connection failed: ' . \$conn->connect_error);
}
\$conn->set_charset('utf8mb4');
";
            file_put_contents(__DIR__ . '/config.php', $configContent);
            
            // Create install.lock
            file_put_contents(__DIR__ . '/install.lock', date('Y-m-d H:i:s'));
            
            $conn->close();
            
            die('AUTO-INSTALL SUCCESS: Database configured and admin account created.');
            
        } catch (Exception $e) {
            die('AUTO-INSTALL FAILED: ' . $e->getMessage());
        }
    } else {
        die('AUTO-INSTALL FAILED: Missing database credentials.');
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StreakUp - Installation Wizard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
    <?php if ($installed): ?>
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-check text-4xl text-emerald-600"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-4">Already Installed</h1>
            <p class="text-gray-600 mb-6">StreakUp is already configured and ready to use!</p>
            <a href="index.php" class="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                Go to Application
            </a>
        </div>
    </div>
    <?php else: ?>
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i class="fas fa-database text-3xl text-white"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">StreakUp Installation</h1>
                <p class="text-gray-600">Set up your database and admin account</p>
            </div>

            <!-- Progress Steps -->
            <div class="flex items-center justify-center mb-8">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold <?php echo $step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'; ?>">
                            <?php echo $step > 1 ? '<i class="fas fa-check"></i>' : '1'; ?>
                        </div>
                        <span class="ml-2 text-sm font-medium <?php echo $step >= 1 ? 'text-emerald-600' : 'text-gray-400'; ?>">Database</span>
                    </div>
                    <div class="w-12 h-1 bg-gray-200 <?php echo $step > 1 ? 'bg-emerald-600' : ''; ?>"></div>
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold <?php echo $step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'; ?>">
                            <?php echo $step > 2 ? '<i class="fas fa-check"></i>' : '2'; ?>
                        </div>
                        <span class="ml-2 text-sm font-medium <?php echo $step >= 2 ? 'text-emerald-600' : 'text-gray-400'; ?>">Admin</span>
                    </div>
                    <div class="w-12 h-1 bg-gray-200 <?php echo $step > 2 ? 'bg-emerald-600' : ''; ?>"></div>
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold <?php echo $step >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'; ?>">
                            <?php echo $step > 3 ? '<i class="fas fa-check"></i>' : '3'; ?>
                        </div>
                        <span class="ml-2 text-sm font-medium <?php echo $step >= 3 ? 'text-emerald-600' : 'text-gray-400'; ?>">Install</span>
                    </div>
                </div>
            </div>

            <!-- Error Message -->
            <?php if ($error): ?>
            <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center">
                <i class="fas fa-exclamation-circle mr-3"></i>
                <?php echo htmlspecialchars($error); ?>
            </div>
            <?php endif; ?>

            <!-- Step 1: Database Configuration -->
            <?php if ($step === 1): ?>
            <form method="POST" action="install.php?step=1">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Database Host</label>
                        <input type="text" name="db_host" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="sql305.infinityfree.com"
                            value="<?php echo htmlspecialchars($_SESSION['install_db']['host'] ?? 'sql305.infinityfree.com'); ?>">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Database Name</label>
                        <input type="text" name="db_name" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="if0_42480076_streakup"
                            value="<?php echo htmlspecialchars($_SESSION['install_db']['name'] ?? ''); ?>">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Database Username</label>
                        <input type="text" name="db_user" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="if0_42480076"
                            value="<?php echo htmlspecialchars($_SESSION['install_db']['user'] ?? ''); ?>">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Database Password</label>
                        <input type="password" name="db_pass"
                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Your vPanel MySQL Password">
                    </div>
                </div>
                <button type="submit" class="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg">
                    Continue <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </form>
            <?php endif; ?>

            <!-- Step 2: Admin Account -->
            <?php if ($step === 2): ?>
            <form method="POST" action="install.php?step=2">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Admin Name</label>
                        <input type="text" name="admin_name" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="John Doe"
                            value="<?php echo htmlspecialchars($_SESSION['install_admin']['name'] ?? ''); ?>">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Admin Email</label>
                        <input type="email" name="admin_email" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="admin@example.com"
                            value="<?php echo htmlspecialchars($_SESSION['install_admin']['email'] ?? ''); ?>">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Admin Password</label>
                        <input type="password" name="admin_pass" required minlength="6"
                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Minimum 6 characters">
                    </div>
                </div>
                <div class="flex space-x-4 mt-6">
                    <a href="install.php?step=1" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transition-colors text-center">
                        <i class="fas fa-arrow-left mr-2"></i> Back
                    </a>
                    <button type="submit" class="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg">
                        Continue <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </form>
            <?php endif; ?>

            <!-- Step 3: Installation -->
            <?php if ($step === 3): ?>
            <div class="text-center">
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
                    <i class="fas fa-rocket text-4xl text-emerald-600 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Ready to Install</h3>
                    <p class="text-gray-600 text-sm">We're about to configure your database and create your admin account. This will only take a moment.</p>
                </div>
                <div class="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <h4 class="font-bold text-gray-800 mb-3">Configuration Summary:</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Database Host:</span>
                            <span class="font-medium"><?php echo htmlspecialchars($_SESSION['install_db']['host'] ?? ''); ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Database Name:</span>
                            <span class="font-medium"><?php echo htmlspecialchars($_SESSION['install_db']['name'] ?? ''); ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Admin Name:</span>
                            <span class="font-medium"><?php echo htmlspecialchars($_SESSION['install_admin']['name'] ?? ''); ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Admin Email:</span>
                            <span class="font-medium"><?php echo htmlspecialchars($_SESSION['install_admin']['email'] ?? ''); ?></span>
                        </div>
                    </div>
                </div>
                <form method="POST" action="install.php?step=3">
                    <div class="flex space-x-4">
                        <a href="install.php?step=2" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transition-colors text-center">
                            <i class="fas fa-arrow-left mr-2"></i> Back
                        </a>
                        <button type="submit" class="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg">
                            <i class="fas fa-check mr-2"></i> Complete Installation
                        </button>
                    </div>
                </form>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>
</body>
</html>

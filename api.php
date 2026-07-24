<?php
/**
 * StreakUp REST API
 * Backend API for InfinityFree PHP hosting
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database configuration
require_once 'config.php';

// Helper function to send JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Helper function to get request body
function getRequestBody() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

// Helper function to calculate streak
function calculateStreak($logs) {
    if (empty($logs)) {
        return ['currentStreak' => 0, 'longestStreak' => 0, 'totalStudyMinutes' => 0];
    }
    
    usort($logs, function($a, $b) {
        return strtotime($a['cycle_date']) - strtotime($b['cycle_date']);
    });
    
    $currentStreak = 0;
    $longestStreak = 0;
    $tempStreak = 0;
    $totalStudyMinutes = 0;
    $previousDate = null;
    
    foreach ($logs as $log) {
        $totalStudyMinutes += $log['study_minutes'];
        
        if ($log['meets_streak_criteria']) {
            if ($previousDate === null) {
                $tempStreak = 1;
            } else {
                $prevDate = new DateTime($previousDate);
                $currDate = new DateTime($log['cycle_date']);
                $interval = $prevDate->diff($currDate);
                
                if ($interval->days == 1) {
                    $tempStreak++;
                } else {
                    $tempStreak = 1;
                }
            }
            
            if ($tempStreak > $longestStreak) {
                $longestStreak = $tempStreak;
            }
            
            $previousDate = $log['cycle_date'];
        }
    }
    
    // Calculate current streak (consecutive days from most recent)
    $currentStreak = 0;
    $previousDate = null;
    $logsReversed = array_reverse($logs);
    
    foreach ($logsReversed as $log) {
        if ($log['meets_streak_criteria']) {
            if ($previousDate === null) {
                $currentStreak = 1;
            } else {
                $prevDate = new DateTime($previousDate);
                $currDate = new DateTime($log['cycle_date']);
                $interval = $prevDate->diff($currDate);
                
                if ($interval->days == 1) {
                    $currentStreak++;
                } else {
                    break;
                }
            }
            $previousDate = $log['cycle_date'];
        } else {
            break;
        }
    }
    
    return [
        'currentStreak' => $currentStreak,
        'longestStreak' => $longestStreak,
        'totalStudyMinutes' => $totalStudyMinutes
    ];
}

// Helper function to get study cycle date (5 AM cutoff)
function getStudyCycleDate($date = null) {
    if ($date === null) {
        $date = new DateTime();
    } elseif (is_string($date)) {
        $date = new DateTime($date);
    }
    
    // If it's before 5 AM, count as previous day
    if ($date->format('H') < 5) {
        $date->modify('-1 day');
    }
    
    return $date->format('Y-m-d');
}

// Helper function to format minutes to hours and minutes
function formatMinutesToHM($minutes) {
    $hours = floor($minutes / 60);
    $mins = $minutes % 60;
    return "{$hours}h {$mins}m";
}

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api.php', '', $requestPath);
$path = str_replace('/api', '', $path);

// Remove leading slash if present
$path = ltrim($path, '/');

// Parse path segments
$segments = explode('/', $path);
$endpoint = $segments[0] ?? '';
$id = $segments[1] ?? null;

// Route the request
try {
    switch ($endpoint) {
        // Authentication
        case 'auth':
            $action = $segments[1] ?? '';
            
            if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
                $body = getRequestBody();
                $name = trim($body['name'] ?? '');
                $email = trim($body['email'] ?? '');
                $password = $body['password'] ?? '';
                
                if (empty($name) || empty($email) || empty($password)) {
                    sendResponse(['error' => 'Name, email, and password are required'], 400);
                }
                
                $email = strtolower($email);
                
                // Check if user exists
                $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->bind_param('s', $email);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    sendResponse(['error' => 'An account with this email already exists. Please log in.'], 400);
                }
                
                // Create user
                $userId = 'usr_' . time();
                $isFirstAdmin = strpos($email, 'admin@') !== false;
                $role = $isFirstAdmin ? 'admin' : 'student';
                $avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($name);
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                
                $stmt = $conn->prepare("INSERT INTO users (id, name, email, password, role, avatar, bio, target_hours_per_day) VALUES (?, ?, ?, ?, ?, ?, ?, 8)");
                $bio = 'Dedicated student aiming high!';
                $stmt->bind_param('sssssss', $userId, $name, $email, $hashedPassword, $role, $avatar, $bio);
                $stmt->execute();
                
                // Get created user
                $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->bind_param('s', $userId);
                $stmt->execute();
                $result = $stmt->get_result();
                $user = $result->fetch_assoc();
                
                sendResponse(['success' => true, 'user' => $user]);
            }
            
            if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
                $body = getRequestBody();
                $email = trim($body['email'] ?? '');
                $password = $body['password'] ?? '';
                
                if (empty($email)) {
                    sendResponse(['error' => 'Email required'], 400);
                }
                
                $email = strtolower($email);
                
                $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->bind_param('s', $email);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows === 0) {
                    sendResponse(['error' => 'Account not found. Please register first.'], 404);
                }
                
                $user = $result->fetch_assoc();
                
                // For development, accept any password if not set
                if (!empty($user['password']) && !password_verify($password, $user['password'])) {
                    sendResponse(['error' => 'Invalid password'], 401);
                }
                
                sendResponse(['success' => true, 'user' => $user]);
            }
            
            sendResponse(['error' => 'Invalid auth endpoint'], 404);
            break;
        
        // User profile
        case 'user':
            if ($segments[1] === 'profile' && $_SERVER['REQUEST_METHOD'] === 'PUT') {
                $body = getRequestBody();
                $userId = $body['userId'] ?? '';
                $name = trim($body['name'] ?? '');
                $bio = trim($body['bio'] ?? '');
                $targetHours = $body['targetHoursPerDay'] ?? '';
                $avatar = $body['avatar'] ?? '';
                
                if (empty($userId)) {
                    sendResponse(['error' => 'User ID required'], 400);
                }
                
                $updates = [];
                $params = [];
                $types = '';
                
                if (!empty($name)) {
                    $updates[] = 'name = ?';
                    $params[] = $name;
                    $types .= 's';
                }
                if ($bio !== '') {
                    $updates[] = 'bio = ?';
                    $params[] = $bio;
                    $types .= 's';
                }
                if (!empty($targetHours)) {
                    $updates[] = 'target_hours_per_day = ?';
                    $params[] = (int)$targetHours;
                    $types .= 'i';
                }
                if (!empty($avatar)) {
                    $updates[] = 'avatar = ?';
                    $params[] = $avatar;
                    $types .= 's';
                }
                
                if (empty($updates)) {
                    sendResponse(['error' => 'No fields to update'], 400);
                }
                
                $params[] = $userId;
                $types .= 's';
                
                $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                
                // Update user name in logs
                if (!empty($name)) {
                    $stmt = $conn->prepare("UPDATE study_logs SET user_name = ? WHERE user_id = ?");
                    $stmt->bind_param('ss', $name, $userId);
                    $stmt->execute();
                }
                
                // Get updated user
                $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->bind_param('s', $userId);
                $stmt->execute();
                $result = $stmt->get_result();
                $user = $result->fetch_assoc();
                
                sendResponse(['success' => true, 'user' => $user]);
            }
            
            sendResponse(['error' => 'Invalid user endpoint'], 404);
            break;
        
        // Study logs
        case 'logs':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $body = getRequestBody();
                $userId = $body['userId'] ?? '';
                $hours = $body['hours'] ?? 0;
                $minutes = $body['minutes'] ?? 0;
                $privateMessage = trim($body['privateMessage'] ?? '');
                
                if (empty($userId)) {
                    sendResponse(['error' => 'User ID is required'], 400);
                }
                
                $totalMinutes = (int)$hours * 60 + (int)$minutes;
                if ($totalMinutes <= 0) {
                    sendResponse(['error' => 'Please enter a valid study time greater than 0 minutes.'], 400);
                }
                
                // Get user
                $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->bind_param('s', $userId);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows === 0) {
                    sendResponse(['error' => 'User not found'], 404);
                }
                
                $user = $result->fetch_assoc();
                $cycleDate = getStudyCycleDate();
                
                // Check if log exists for today
                $stmt = $conn->prepare("SELECT * FROM study_logs WHERE user_id = ? AND cycle_date = ?");
                $stmt->bind_param('ss', $userId, $cycleDate);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    // Update existing log
                    $existingLog = $result->fetch_assoc();
                    $logId = $existingLog['id'];
                    
                    $stmt = $conn->prepare("UPDATE study_logs SET study_minutes = ?, study_hours_formatted = ?, private_message = ?, logged_at = NOW() WHERE id = ?");
                    $formatted = formatMinutesToHM($totalMinutes);
                    $stmt->bind_param('isss', $totalMinutes, $formatted, $privateMessage, $logId);
                    $stmt->execute();
                } else {
                    // Create new log
                    $logId = 'log_' . time();
                    $formatted = formatMinutesToHM($totalMinutes);
                    
                    $stmt = $conn->prepare("INSERT INTO study_logs (id, user_id, user_name, cycle_date, study_minutes, study_hours_formatted, private_message, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
                    $stmt->bind_param('ssssiss', $logId, $userId, $user['name'], $cycleDate, $totalMinutes, $formatted, $privateMessage);
                    $stmt->execute();
                }
                
                // Get all user logs and calculate streak
                $stmt = $conn->prepare("SELECT * FROM study_logs WHERE user_id = ? ORDER BY cycle_date ASC");
                $stmt->bind_param('s', $userId);
                $stmt->execute();
                $result = $stmt->get_result();
                $logs = [];
                while ($row = $result->fetch_assoc()) {
                    $logs[] = $row;
                }
                
                $streakInfo = calculateStreak($logs);
                
                // Update streak criteria for today's log
                $targetHours = $user['target_hours_per_day'] ?? 8;
                $targetMinutes = $targetHours * 60;
                $meetsCriteria = $totalMinutes >= $targetMinutes;
                
                $stmt = $conn->prepare("UPDATE study_logs SET meets_streak_criteria = ? WHERE user_id = ? AND cycle_date = ?");
                $stmt->bind_param('iss', $meetsCriteria, $userId, $cycleDate);
                $stmt->execute();
                
                // Get updated log
                $stmt = $conn->prepare("SELECT * FROM study_logs WHERE user_id = ? AND cycle_date = ?");
                $stmt->bind_param('ss', $userId, $cycleDate);
                $stmt->execute();
                $result = $stmt->get_result();
                $log = $result->fetch_assoc();
                
                // Convert snake_case to camelCase for frontend compatibility
                $logFormatted = [
                    'id' => $log['id'],
                    'userId' => $log['user_id'],
                    'userName' => $log['user_name'],
                    'cycleDate' => $log['cycle_date'],
                    'studyMinutes' => $log['study_minutes'],
                    'studyHoursFormatted' => $log['study_hours_formatted'],
                    'privateMessage' => $log['private_message'],
                    'loggedAt' => $log['logged_at'],
                    'streakCountAtLog' => $log['streak_count_at_log'],
                    'meetsStreakCriteria' => $log['meets_streak_criteria'],
                ];
                
                sendResponse(['success' => true, 'log' => $logFormatted, 'streakInfo' => $streakInfo]);
            }
            
            if ($_SERVER['REQUEST_METHOD'] === 'GET' && $id) {
                $stmt = $conn->prepare("SELECT * FROM study_logs WHERE user_id = ? ORDER BY cycle_date DESC");
                $stmt->bind_param('s', $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $logs = [];
                while ($row = $result->fetch_assoc()) {
                    // Convert snake_case to camelCase for frontend compatibility
                    $logs[] = [
                        'id' => $row['id'],
                        'userId' => $row['user_id'],
                        'userName' => $row['user_name'],
                        'cycleDate' => $row['cycle_date'],
                        'studyMinutes' => $row['study_minutes'],
                        'studyHoursFormatted' => $row['study_hours_formatted'],
                        'privateMessage' => $row['private_message'],
                        'loggedAt' => $row['logged_at'],
                        'streakCountAtLog' => $row['streak_count_at_log'],
                        'meetsStreakCriteria' => $row['meets_streak_criteria'],
                    ];
                }
                
                $streakInfo = calculateStreak($logs);
                
                sendResponse(['logs' => $logs, 'streakInfo' => $streakInfo]);
            }
            
            sendResponse(['error' => 'Invalid logs endpoint'], 404);
            break;
        
        // Leaderboard
        case 'leaderboard':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $todayCycle = getStudyCycleDate();
                
                $stmt = $conn->prepare("SELECT * FROM users WHERE role = 'student'");
                $stmt->execute();
                $result = $stmt->get_result();
                $students = [];
                while ($row = $result->fetch_assoc()) {
                    $students[] = $row;
                }
                
                $leaderboard = [];
                foreach ($students as $student) {
                    $userId = $student['id'];
                    
                    // Get user logs
                    $stmt = $conn->prepare("SELECT * FROM study_logs WHERE user_id = ? ORDER BY cycle_date ASC");
                    $stmt->bind_param('s', $userId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $logs = [];
                    while ($row = $result->fetch_assoc()) {
                        $logs[] = $row;
                    }
                    
                    $streakInfo = calculateStreak($logs);
                    
                    // Calculate last 7 days
                    $last7DaysLogs = array_filter($logs, function($log) use ($todayCycle) {
                        $logDate = new DateTime($log['cycle_date']);
                        $today = new DateTime($todayCycle);
                        $interval = $today->diff($logDate);
                        return $interval->days < 7;
                    });
                    $lastWeekStudyMinutes = array_sum(array_column($last7DaysLogs, 'study_minutes'));
                    
                    // Get today's log
                    $todayLog = null;
                    foreach ($logs as $log) {
                        if ($log['cycle_date'] === $todayCycle) {
                            $todayLog = $log;
                            break;
                        }
                    }
                    
                    // Get last log
                    $lastLog = !empty($logs) ? end($logs) : null;
                    
                    // Get mentor feedback
                    $stmt = $conn->prepare("SELECT * FROM mentor_feedbacks WHERE user_id = ?");
                    $stmt->bind_param('s', $userId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $feedback = $result->fetch_assoc();
                    
                    // Get private messages
                    $privateMessages = [];
                    foreach ($logs as $log) {
                        if (!empty($log['private_message'])) {
                            $privateMessages[] = [
                                'date' => $log['cycle_date'],
                                'message' => $log['private_message']
                            ];
                        }
                    }
                    usort($privateMessages, function($a, $b) {
                        return strtotime($b['date']) - strtotime($a['date']);
                    });
                    
                    $leaderboard[] = [
                        'userId' => $student['id'],
                        'userName' => $student['name'],
                        'userAvatar' => $student['avatar'],
                        'currentStreak' => $streakInfo['currentStreak'],
                        'longestStreak' => $streakInfo['longestStreak'],
                        'totalStudyMinutes' => $streakInfo['totalStudyMinutes'],
                        'lastWeekStudyMinutes' => $lastWeekStudyMinutes,
                        'lastCycleDate' => $lastLog ? $lastLog['cycle_date'] : null,
                        'lastStudyMinutes' => $lastLog ? $lastLog['study_minutes'] : null,
                        'todayLog' => $todayLog,
                        'mentorFeedback' => $feedback ? $feedback['content'] : null,
                        'privateMessages' => $privateMessages
                    ];
                }
                
                // Sort by current streak, then total study minutes
                usort($leaderboard, function($a, $b) {
                    if ($b['currentStreak'] !== $a['currentStreak']) {
                        return $b['currentStreak'] - $a['currentStreak'];
                    }
                    return $b['totalStudyMinutes'] - $a['totalStudyMinutes'];
                });
                
                // Add ranks
                foreach ($leaderboard as $index => &$item) {
                    $item['rank'] = $index + 1;
                }
                
                sendResponse(['leaderboard' => $leaderboard, 'todayCycle' => $todayCycle]);
            }
            
            sendResponse(['error' => 'Invalid leaderboard endpoint'], 404);
            break;
        
        // Admin feedback
        case 'admin':
            if ($segments[1] === 'feedback' && $_SERVER['REQUEST_METHOD'] === 'POST') {
                $body = getRequestBody();
                $studentId = $body['studentId'] ?? '';
                $adminId = $body['adminId'] ?? '';
                $content = trim($body['content'] ?? '');
                
                if (empty($studentId) || empty($content)) {
                    sendResponse(['error' => 'Student ID and content required'], 400);
                }
                
                // Get admin name
                $adminName = 'Mentor';
                if (!empty($adminId)) {
                    $stmt = $conn->prepare("SELECT name FROM users WHERE id = ?");
                    $stmt->bind_param('s', $adminId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    if ($row = $result->fetch_assoc()) {
                        $adminName = $row['name'];
                    }
                }
                
                // Check if feedback exists
                $stmt = $conn->prepare("SELECT * FROM mentor_feedbacks WHERE user_id = ?");
                $stmt->bind_param('s', $studentId);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    // Update existing
                    $stmt = $conn->prepare("UPDATE mentor_feedbacks SET content = ?, admin_id = ?, admin_name = ?, updated_at = NOW() WHERE user_id = ?");
                    $stmt->bind_param('ssss', $content, $adminId, $adminName, $studentId);
                    $stmt->execute();
                } else {
                    // Create new
                    $feedbackId = 'fb_' . time();
                    $stmt = $conn->prepare("INSERT INTO mentor_feedbacks (id, user_id, admin_id, admin_name, content, updated_at) VALUES (?, ?, ?, ?, ?, NOW())");
                    $stmt->bind_param('sssss', $feedbackId, $studentId, $adminId, $adminName, $content);
                    $stmt->execute();
                }
                
                // Get updated feedback
                $stmt = $conn->prepare("SELECT * FROM mentor_feedbacks WHERE user_id = ?");
                $stmt->bind_param('s', $studentId);
                $stmt->execute();
                $result = $stmt->get_result();
                $feedback = $result->fetch_assoc();
                
                sendResponse(['success' => true, 'feedback' => $feedback]);
            }
            
            if ($segments[1] === 'messages' && $_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $conn->prepare("SELECT * FROM study_logs WHERE private_message IS NOT NULL AND private_message != '' ORDER BY logged_at DESC");
                $stmt->execute();
                $result = $stmt->get_result();
                $messages = [];
                while ($row = $result->fetch_assoc()) {
                    $messages[] = $row;
                }
                
                sendResponse(['messages' => $messages]);
            }
            
            if ($segments[1] === 'notice' && $_SERVER['REQUEST_METHOD'] === 'POST') {
                $body = getRequestBody();
                $content = trim($body['content'] ?? '');
                $active = isset($body['active']) ? ($body['active'] ? 1 : 0) : 1;
                $updatedBy = trim($body['updatedBy'] ?? 'Admin');
                
                // Delete all existing notices first
                $conn->query("DELETE FROM notices");
                
                $noticeId = 'notice_' . time();
                
                $stmt = $conn->prepare("INSERT INTO notices (id, content, active, updated_at, updated_by) VALUES (?, ?, ?, NOW(), ?)");
                $stmt->bind_param('ssis', $noticeId, $content, $active, $updatedBy);
                $stmt->execute();
                
                // Get created notice
                $stmt = $conn->prepare("SELECT * FROM notices WHERE id = ?");
                $stmt->bind_param('s', $noticeId);
                $stmt->execute();
                $result = $stmt->get_result();
                $notice = $result->fetch_assoc();
                
                sendResponse(['success' => true, 'notice' => $notice]);
            }
            
            sendResponse(['error' => 'Invalid admin endpoint'], 404);
            break;
        
        // Notices
        case 'notice':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $conn->prepare("SELECT * FROM notices ORDER BY updated_at DESC LIMIT 1");
                $stmt->execute();
                $result = $stmt->get_result();
                $notice = $result->fetch_assoc();
                
                sendResponse(['notice' => $notice]);
            }
            
            sendResponse(['error' => 'Invalid notice endpoint'], 404);
            break;
        
        // Threads
        case 'threads':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $conn->prepare("SELECT * FROM threads ORDER BY created_at DESC");
                $stmt->execute();
                $result = $stmt->get_result();
                $threads = [];
                while ($row = $result->fetch_assoc()) {
                    // Get comments for each thread
                    $threadId = $row['id'];
                    
                    // Check if new columns exist
                    $columnCheck = $conn->query("SHOW COLUMNS FROM thread_comments LIKE 'upvotes_count'");
                    $hasVotingColumns = $columnCheck->num_rows > 0;
                    
                    if ($hasVotingColumns) {
                        $commentStmt = $conn->prepare("SELECT tc.*, 
                            (SELECT COUNT(*) FROM comment_votes WHERE comment_id = tc.id AND vote_type = 'upvote') as upvotes_count,
                            (SELECT COUNT(*) FROM comment_votes WHERE comment_id = tc.id AND vote_type = 'downvote') as downvotes_count
                            FROM thread_comments tc WHERE tc.thread_id = ? ORDER BY tc.created_at ASC");
                    } else {
                        $commentStmt = $conn->prepare("SELECT * FROM thread_comments WHERE thread_id = ? ORDER BY created_at ASC");
                    }
                    $commentStmt->bind_param('s', $threadId);
                    $commentStmt->execute();
                    $commentResult = $commentStmt->get_result();
                    $comments = [];
                    while ($commentRow = $commentResult->fetch_assoc()) {
                        // Add default values if columns don't exist
                        if (!$hasVotingColumns) {
                            $commentRow['upvotes_count'] = 0;
                            $commentRow['downvotes_count'] = 0;
                        }
                        
                        // Get user's vote for each comment
                        $userIdParam = $_GET['user_id'] ?? null;
                        if ($userIdParam && $hasVotingColumns) {
                            $commentVoteStmt = $conn->prepare("SELECT vote_type FROM comment_votes WHERE comment_id = ? AND user_id = ?");
                            $commentVoteStmt->bind_param('ss', $commentRow['id'], $userIdParam);
                            $commentVoteStmt->execute();
                            $voteResult = $commentVoteStmt->get_result();
                            $userVote = $voteResult->fetch_assoc();
                            $commentRow['userVote'] = $userVote ? $userVote['vote_type'] : null;
                        } else {
                            $commentRow['userVote'] = null;
                        }
                        
                        $comments[] = $commentRow;
                    }
                    $row['comments'] = $comments;
                    $row['commentCount'] = count($comments);
                    
                    // Check if thread voting columns exist
                    $threadVoteCheck = $conn->query("SHOW COLUMNS FROM threads LIKE 'upvotes_count'");
                    $hasThreadVoting = $threadVoteCheck->num_rows > 0;
                    
                    if (!$hasThreadVoting) {
                        // Migrate old likes_count to new voting system
                        $row['upvotes_count'] = $row['likes_count'] ?? 0;
                        $row['downvotes_count'] = 0;
                    }
                    
                    // Get user's vote for each thread (if user_id is provided in query param)
                    $userIdParam = $_GET['user_id'] ?? null;
                    if ($userIdParam && $hasThreadVoting) {
                        $voteStmt = $conn->prepare("SELECT vote_type FROM thread_votes WHERE thread_id = ? AND user_id = ?");
                        $voteStmt->bind_param('ss', $threadId, $userIdParam);
                        $voteStmt->execute();
                        $voteResult = $voteStmt->get_result();
                        $userVote = $voteResult->fetch_assoc();
                        $row['userVote'] = $userVote ? $userVote['vote_type'] : null;
                    } elseif ($userIdParam && !$hasThreadVoting) {
                        // Check legacy likes
                        $likeStmt = $conn->prepare("SELECT * FROM thread_likes WHERE thread_id = ? AND user_id = ?");
                        $likeStmt->bind_param('ss', $threadId, $userIdParam);
                        $likeStmt->execute();
                        $likeResult = $likeStmt->get_result();
                        $row['userVote'] = $likeResult->num_rows > 0 ? 'upvote' : null;
                    } else {
                        $row['userVote'] = null;
                    }
                    
                    $threads[] = $row;
                }
                
                sendResponse(['threads' => $threads]);
            }
            
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $body = getRequestBody();
                $userId = $body['userId'] ?? '';
                $title = trim($body['title'] ?? '');
                $content = trim($body['content'] ?? '');
                
                if (empty($userId) || empty($content)) {
                    sendResponse(['error' => 'User ID and content required'], 400);
                }
                
                // Get user
                $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->bind_param('s', $userId);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows === 0) {
                    sendResponse(['error' => 'User not found'], 404);
                }
                
                $user = $result->fetch_assoc();
                $threadId = 'th_' . time();
                
                // Check if voting columns exist
                $voteCheck = $conn->query("SHOW COLUMNS FROM threads LIKE 'upvotes_count'");
                $hasVoting = $voteCheck->num_rows > 0;
                
                // Check if updated_at column exists
                $columnCheck = $conn->query("SHOW COLUMNS FROM threads LIKE 'updated_at'");
                $hasUpdatedAt = $columnCheck->num_rows > 0;
                
                if ($hasVoting && $hasUpdatedAt) {
                    $stmt = $conn->prepare("INSERT INTO threads (id, user_id, user_name, user_avatar, user_role, title, content, upvotes_count, downvotes_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())");
                    $stmt->bind_param('sssssss', $threadId, $userId, $user['name'], $user['avatar'], $user['role'], $title, $content);
                } elseif ($hasVoting) {
                    $stmt = $conn->prepare("INSERT INTO threads (id, user_id, user_name, user_avatar, user_role, title, content, upvotes_count, downvotes_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())");
                    $stmt->bind_param('sssssss', $threadId, $userId, $user['name'], $user['avatar'], $user['role'], $title, $content);
                } elseif ($hasUpdatedAt) {
                    $stmt = $conn->prepare("INSERT INTO threads (id, user_id, user_name, user_avatar, user_role, title, content, likes_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())");
                    $stmt->bind_param('sssssss', $threadId, $userId, $user['name'], $user['avatar'], $user['role'], $title, $content);
                } else {
                    $stmt = $conn->prepare("INSERT INTO threads (id, user_id, user_name, user_avatar, user_role, title, content, likes_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())");
                    $stmt->bind_param('sssssss', $threadId, $userId, $user['name'], $user['avatar'], $user['role'], $title, $content);
                }
                
                if (!$stmt->execute()) {
                    sendResponse(['error' => 'Failed to create thread: ' . $conn->error], 500);
                }
                
                // Get created thread
                $stmt = $conn->prepare("SELECT * FROM threads WHERE id = ?");
                $stmt->bind_param('s', $threadId);
                $stmt->execute();
                $result = $stmt->get_result();
                $thread = $result->fetch_assoc();
                $thread['comments'] = [];
                $thread['commentCount'] = 0;
                
                // Add default voting values if columns don't exist
                if (!$hasVoting) {
                    $thread['upvotes_count'] = $thread['likes_count'] ?? 0;
                    $thread['downvotes_count'] = 0;
                }
                
                sendResponse(['success' => true, 'thread' => $thread]);
            }
            
            // Thread actions
            if ($id && $_SERVER['REQUEST_METHOD'] === 'POST') {
                $action = $segments[2] ?? '';
                
                if ($action === 'vote') {
                    $body = getRequestBody();
                    $userId = $body['userId'] ?? '';
                    $voteType = $body['voteType'] ?? '';
                    
                    if (empty($userId) || empty($voteType)) {
                        sendResponse(['error' => 'User ID and vote type required'], 400);
                    }
                    
                    if (!in_array($voteType, ['upvote', 'downvote'])) {
                        sendResponse(['error' => 'Invalid vote type'], 400);
                    }
                    
                    // Check if thread_votes table exists
                    $tableCheck = $conn->query("SHOW TABLES LIKE 'thread_votes'");
                    $hasThreadVotes = $tableCheck->num_rows > 0;
                    
                    // Check if voting columns exist
                    $columnCheck = $conn->query("SHOW COLUMNS FROM threads LIKE 'upvotes_count'");
                    $hasVotingColumns = $columnCheck->num_rows > 0;
                    
                    if (!$hasThreadVotes || !$hasVotingColumns) {
                        // Fallback to old likes system for backward compatibility
                        $stmt = $conn->prepare("SELECT * FROM thread_likes WHERE thread_id = ? AND user_id = ?");
                        $stmt->bind_param('ss', $id, $userId);
                        $stmt->execute();
                        $result = $stmt->get_result();
                        
                        if ($result->num_rows > 0 && $voteType === 'upvote') {
                            // Unlike (toggle off)
                            $stmt = $conn->prepare("DELETE FROM thread_likes WHERE thread_id = ? AND user_id = ?");
                            $stmt->bind_param('ss', $id, $userId);
                            $stmt->execute();
                            
                            $stmt = $conn->prepare("UPDATE threads SET likes_count = likes_count - 1 WHERE id = ?");
                            $stmt->bind_param('s', $id);
                            $stmt->execute();
                            
                            $userVote = null;
                        } elseif ($voteType === 'upvote') {
                            // Like
                            $stmt = $conn->prepare("INSERT INTO thread_likes (thread_id, user_id) VALUES (?, ?)");
                            $stmt->bind_param('ss', $id, $userId);
                            $stmt->execute();
                            
                            $stmt = $conn->prepare("UPDATE threads SET likes_count = likes_count + 1 WHERE id = ?");
                            $stmt->bind_param('s', $id);
                            $stmt->execute();
                            
                            $userVote = 'upvote';
                        } else {
                            sendResponse(['error' => 'Downvotes not supported in legacy mode'], 400);
                        }
                        
                        // Get updated count
                        $stmt = $conn->prepare("SELECT likes_count FROM threads WHERE id = ?");
                        $stmt->bind_param('s', $id);
                        $stmt->execute();
                        $result = $stmt->get_result();
                        $thread = $result->fetch_assoc();
                        
                        sendResponse([
                            'success' => true,
                            'upvotesCount' => $thread['likes_count'] ?? 0,
                            'downvotesCount' => 0,
                            'userVote' => $userVote
                        ]);
                    }
                    
                    // New voting system
                    // Check if already voted
                    $stmt = $conn->prepare("SELECT * FROM thread_votes WHERE thread_id = ? AND user_id = ?");
                    $stmt->bind_param('ss', $id, $userId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    if ($result->num_rows > 0) {
                        $existingVote = $result->fetch_assoc();
                        
                        if ($existingVote['vote_type'] === $voteType) {
                            // Remove vote
                            $stmt = $conn->prepare("DELETE FROM thread_votes WHERE thread_id = ? AND user_id = ?");
                            $stmt->bind_param('ss', $id, $userId);
                            $stmt->execute();
                            
                            if ($voteType === 'upvote') {
                                $stmt = $conn->prepare("UPDATE threads SET upvotes_count = upvotes_count - 1 WHERE id = ?");
                            } else {
                                $stmt = $conn->prepare("UPDATE threads SET downvotes_count = downvotes_count - 1 WHERE id = ?");
                            }
                            $stmt->bind_param('s', $id);
                            $stmt->execute();
                            
                            $userVote = null;
                        } else {
                            // Change vote type
                            $stmt = $conn->prepare("UPDATE thread_votes SET vote_type = ? WHERE thread_id = ? AND user_id = ?");
                            $stmt->bind_param('sss', $voteType, $id, $userId);
                            $stmt->execute();
                            
                            if ($voteType === 'upvote') {
                                $stmt = $conn->prepare("UPDATE threads SET upvotes_count = upvotes_count + 1, downvotes_count = downvotes_count - 1 WHERE id = ?");
                            } else {
                                $stmt = $conn->prepare("UPDATE threads SET upvotes_count = upvotes_count - 1, downvotes_count = downvotes_count + 1 WHERE id = ?");
                            }
                            $stmt->bind_param('s', $id);
                            $stmt->execute();
                            
                            $userVote = $voteType;
                        }
                    } else {
                        // New vote
                        $stmt = $conn->prepare("INSERT INTO thread_votes (thread_id, user_id, vote_type) VALUES (?, ?, ?)");
                        $stmt->bind_param('sss', $id, $userId, $voteType);
                        $stmt->execute();
                        
                        if ($voteType === 'upvote') {
                            $stmt = $conn->prepare("UPDATE threads SET upvotes_count = upvotes_count + 1 WHERE id = ?");
                        } else {
                            $stmt = $conn->prepare("UPDATE threads SET downvotes_count = downvotes_count + 1 WHERE id = ?");
                        }
                        $stmt->bind_param('s', $id);
                        $stmt->execute();
                        
                        $userVote = $voteType;
                    }
                    
                    // Get updated vote counts
                    $stmt = $conn->prepare("SELECT upvotes_count, downvotes_count FROM threads WHERE id = ?");
                    $stmt->bind_param('s', $id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $thread = $result->fetch_assoc();
                    
                    sendResponse([
                        'success' => true,
                        'upvotesCount' => $thread['upvotes_count'],
                        'downvotesCount' => $thread['downvotes_count'],
                        'userVote' => $userVote
                    ]);
                }
                
                if ($action === 'comment') {
                    $body = getRequestBody();
                    $userId = $body['userId'] ?? '';
                    $content = trim($body['content'] ?? '');
                    $parentCommentId = $body['parentCommentId'] ?? null;
                    
                    if (empty($userId) || empty($content)) {
                        sendResponse(['error' => 'User ID and comment content required'], 400);
                    }
                    
                    // Validate that thread exists
                    $threadCheck = $conn->prepare("SELECT id FROM threads WHERE id = ?");
                    $threadCheck->bind_param('s', $id);
                    $threadCheck->execute();
                    $threadResult = $threadCheck->get_result();
                    
                    if ($threadResult->num_rows === 0) {
                        sendResponse(['error' => 'Thread not found'], 404);
                    }
                    
                    // Validate parent comment if provided
                    if ($parentCommentId !== null) {
                        $parentCheck = $conn->prepare("SELECT id, thread_id FROM thread_comments WHERE id = ?");
                        $parentCheck->bind_param('s', $parentCommentId);
                        $parentCheck->execute();
                        $parentResult = $parentCheck->get_result();
                        
                        if ($parentResult->num_rows === 0) {
                            sendResponse(['error' => 'Parent comment not found'], 404);
                        }
                        
                        $parentComment = $parentResult->fetch_assoc();
                        if ($parentComment['thread_id'] !== $id) {
                            sendResponse(['error' => 'Parent comment does not belong to this thread'], 400);
                        }
                    }
                    
                    // Get user
                    $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
                    $stmt->bind_param('s', $userId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    if ($result->num_rows === 0) {
                        sendResponse(['error' => 'User not found'], 404);
                    }
                    
                    $user = $result->fetch_assoc();
                    $commentId = 'cm_' . time();
                    
                    // Check if parent_comment_id column exists
                    $columnCheck = $conn->query("SHOW COLUMNS FROM thread_comments LIKE 'parent_comment_id'");
                    $hasParentColumn = $columnCheck->num_rows > 0;
                    
                    // Check if voting columns exist
                    $votingCheck = $conn->query("SHOW COLUMNS FROM thread_comments LIKE 'upvotes_count'");
                    $hasVotingColumns = $votingCheck->num_rows > 0;
                    
                    if ($hasParentColumn && $hasVotingColumns) {
                        $stmt = $conn->prepare("INSERT INTO thread_comments (id, thread_id, parent_comment_id, user_id, user_name, user_avatar, user_role, content, upvotes_count, downvotes_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())");
                        $stmt->bind_param('sssssssss', $commentId, $id, $parentCommentId, $userId, $user['name'], $user['avatar'], $user['role'], $content);
                    } elseif ($hasParentColumn) {
                        $stmt = $conn->prepare("INSERT INTO thread_comments (id, thread_id, parent_comment_id, user_id, user_name, user_avatar, user_role, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
                        $stmt->bind_param('ssssssss', $commentId, $id, $parentCommentId, $userId, $user['name'], $user['avatar'], $user['role'], $content);
                    } elseif ($hasVotingColumns) {
                        $stmt = $conn->prepare("INSERT INTO thread_comments (id, thread_id, user_id, user_name, user_avatar, user_role, content, upvotes_count, downvotes_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())");
                        $stmt->bind_param('ssssssss', $commentId, $id, $userId, $user['name'], $user['avatar'], $user['role'], $content);
                    } else {
                        $stmt = $conn->prepare("INSERT INTO thread_comments (id, thread_id, user_id, user_name, user_avatar, user_role, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
                        $stmt->bind_param('sssssss', $commentId, $id, $userId, $user['name'], $user['avatar'], $user['role'], $content);
                    }
                    
                    if (!$stmt->execute()) {
                        sendResponse(['error' => 'Failed to create comment: ' . $conn->error], 500);
                    }
                    
                    // Get created comment with all fields
                    $stmt = $conn->prepare("SELECT * FROM thread_comments WHERE id = ?");
                    $stmt->bind_param('s', $commentId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $comment = $result->fetch_assoc();
                    
                    // Add default values if columns don't exist
                    if (!$hasVotingColumns) {
                        $comment['upvotes_count'] = 0;
                        $comment['downvotes_count'] = 0;
                    }
                    if (!$hasParentColumn) {
                        $comment['parent_comment_id'] = null;
                    }
                    
                    sendResponse(['success' => true, 'comment' => $comment]);
                }
                
                // Comment vote actions
                if ($action === 'vote') {
                    $body = getRequestBody();
                    $userId = $body['userId'] ?? '';
                    $voteType = $body['voteType'] ?? '';
                    $commentId = $segments[3] ?? '';
                    
                    if (empty($userId) || empty($voteType) || empty($commentId)) {
                        sendResponse(['error' => 'User ID, vote type, and comment ID required'], 400);
                    }
                    
                    if (!in_array($voteType, ['upvote', 'downvote'])) {
                        sendResponse(['error' => 'Invalid vote type'], 400);
                    }
                    
                    // Check if already voted
                    $stmt = $conn->prepare("SELECT * FROM comment_votes WHERE comment_id = ? AND user_id = ?");
                    $stmt->bind_param('ss', $commentId, $userId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    if ($result->num_rows > 0) {
                        $existingVote = $result->fetch_assoc();
                        
                        if ($existingVote['vote_type'] === $voteType) {
                            // Remove vote
                            $stmt = $conn->prepare("DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?");
                            $stmt->bind_param('ss', $commentId, $userId);
                            $stmt->execute();
                            
                            if ($voteType === 'upvote') {
                                $stmt = $conn->prepare("UPDATE thread_comments SET upvotes_count = upvotes_count - 1 WHERE id = ?");
                            } else {
                                $stmt = $conn->prepare("UPDATE thread_comments SET downvotes_count = downvotes_count - 1 WHERE id = ?");
                            }
                            $stmt->bind_param('s', $commentId);
                            $stmt->execute();
                        } else {
                            // Change vote type
                            $stmt = $conn->prepare("UPDATE comment_votes SET vote_type = ? WHERE comment_id = ? AND user_id = ?");
                            $stmt->bind_param('sss', $voteType, $commentId, $userId);
                            $stmt->execute();
                            
                            if ($voteType === 'upvote') {
                                $stmt = $conn->prepare("UPDATE thread_comments SET upvotes_count = upvotes_count + 1, downvotes_count = downvotes_count - 1 WHERE id = ?");
                            } else {
                                $stmt = $conn->prepare("UPDATE thread_comments SET upvotes_count = upvotes_count - 1, downvotes_count = downvotes_count + 1 WHERE id = ?");
                            }
                            $stmt->bind_param('s', $commentId);
                            $stmt->execute();
                        }
                    } else {
                        // New vote
                        $stmt = $conn->prepare("INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES (?, ?, ?)");
                        $stmt->bind_param('sss', $commentId, $userId, $voteType);
                        $stmt->execute();
                        
                        if ($voteType === 'upvote') {
                            $stmt = $conn->prepare("UPDATE thread_comments SET upvotes_count = upvotes_count + 1 WHERE id = ?");
                        } else {
                            $stmt = $conn->prepare("UPDATE thread_comments SET downvotes_count = downvotes_count + 1 WHERE id = ?");
                        }
                        $stmt->bind_param('s', $commentId);
                        $stmt->execute();
                    }
                    
                    // Get updated vote counts
                    $stmt = $conn->prepare("SELECT upvotes_count, downvotes_count FROM thread_comments WHERE id = ?");
                    $stmt->bind_param('s', $commentId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $comment = $result->fetch_assoc();
                    
                    // Get user's current vote
                    $stmt = $conn->prepare("SELECT vote_type FROM comment_votes WHERE comment_id = ? AND user_id = ?");
                    $stmt->bind_param('ss', $commentId, $userId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $userVote = $result->fetch_assoc();
                    
                    sendResponse([
                        'success' => true,
                        'upvotesCount' => $comment['upvotes_count'],
                        'downvotesCount' => $comment['downvotes_count'],
                        'userVote' => $userVote ? $userVote['vote_type'] : null
                    ]);
                }
            }
            
            sendResponse(['error' => 'Invalid threads endpoint'], 404);
            break;
        
        default:
            sendResponse(['error' => 'Endpoint not found'], 404);
    }
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}

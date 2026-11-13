<?php
/**
 * Jacob Davis Portfolio - Escalation Ticket Delivery Endpoint (/api/escalate.php)
 *
 * Receives structured escalation tickets from Carl and delivers
 * a formatted notification email to Jacob Davis (jacobdavissupport@gmail.com).
 */

@ini_set('display_errors', '0');
if (function_exists('header_remove')) {
    @header_remove('X-Powered-By');
}

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Cache-Control: no-store');
header('Vary: Origin');

function respondEscalateJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    $encoded = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    echo $encoded !== false ? $encoded : '{"error":"Internal encoding error."}';
    exit;
}

function isAllowedEscalateOrigin(string $origin): bool
{
    $allowedExact = [
        'https://jacobdavis.tech',
        'https://www.jacobdavis.tech',
        'https://jakedavis.tech',
        'https://www.jakedavis.tech',
    ];
    if (in_array($origin, $allowedExact, true)) {
        return true;
    }

    if (preg_match('/^http:\/\/(?:localhost|127\.0\.0\.1)(?::(\d{1,5}))?\z/', $origin, $matches) === 1) {
        if (!isset($matches[1]) || $matches[1] === '') {
            return true;
        }
        if ($matches[1][0] === '0') {
            return false;
        }
        $port = (int) $matches[1];
        return $port >= 1 && $port <= 65535;
    }

    return false;
}

$rawOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$origin = is_string($rawOrigin) ? trim($rawOrigin) : '';

if ($origin === '') {
    header('Access-Control-Allow-Origin: https://jacobdavis.tech');
} elseif (isAllowedEscalateOrigin($origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    respondEscalateJson(403, ['error' => 'Origin not permitted.']);
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, User-Agent');
header('Access-Control-Max-Age: 86400');

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($requestMethod !== 'POST') {
    respondEscalateJson(405, ['error' => 'Method not allowed. Please use POST.']);
}

// Rate limiter (max 5 escalations per 10 minutes per IP)
$rawIp = $_SERVER['REMOTE_ADDR'] ?? '';
$validatedIp = is_string($rawIp) ? filter_var(trim($rawIp), FILTER_VALIDATE_IP) : false;
$rateKey = $validatedIp !== false ? $validatedIp : 'unknown';

$rateDir = rtrim(sys_get_temp_dir(), '/\\') . '/jd_portfolio_rl_' . substr(hash('sha256', __DIR__), 0, 12);
if (!file_exists($rateDir) && !is_link($rateDir)) {
    @mkdir($rateDir, 0700, true);
}

$canUseRateDir = is_dir($rateDir) && !is_link($rateDir);
if ($canUseRateDir && function_exists('getmyuid') && @fileowner($rateDir) !== getmyuid()) {
    $canUseRateDir = false;
}

if ($canUseRateDir) {
    @chmod($rateDir, 0700);
    $rateLimitFile = $rateDir . '/escalate_' . hash('sha256', 'escalate:' . $rateKey) . '.json';
    if (!is_link($rateLimitFile)) {
        $fp = @fopen($rateLimitFile, 'c+');
        if ($fp !== false) {
            @chmod($rateLimitFile, 0600);
            if (flock($fp, LOCK_EX)) {
                clearstatcache(true, $rateLimitFile);
                rewind($fp);
                $rawRate = stream_get_contents($fp);
                $parsedRate = (is_string($rawRate) && $rawRate !== '') ? json_decode($rawRate, true) : null;

                $now = time();
                $windowSeconds = 600;
                $maxRequests = 5;
                $rateState = ['count' => 0, 'reset' => $now + $windowSeconds];

                if (
                    is_array($parsedRate)
                    && isset($parsedRate['reset'], $parsedRate['count'])
                    && is_int($parsedRate['reset'])
                    && is_int($parsedRate['count'])
                    && $parsedRate['reset'] > $now
                ) {
                    $rateState = $parsedRate;
                }

                if ($rateState['count'] >= $maxRequests) {
                    $retryAfter = max(1, $rateState['reset'] - $now);
                    flock($fp, LOCK_UN);
                    fclose($fp);
                    header("Retry-After: {$retryAfter}");
                    respondEscalateJson(429, ['error' => 'Too many escalation tickets submitted. Please use email directly or try again shortly.']);
                }

                $rateState['count']++;
                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, json_encode($rateState));
                fflush($fp);
                flock($fp, LOCK_UN);
            }
            fclose($fp);
        }
    }
}

$maxBodyBytes = 16384;
$rawInput = file_get_contents('php://input', false, null, 0, $maxBodyBytes + 1);
if ($rawInput === false || strlen($rawInput) > $maxBodyBytes || trim($rawInput) === '') {
    respondEscalateJson(400, ['error' => 'Invalid or oversized request body.']);
}

$data = json_decode($rawInput, true, 8);
if (!is_array($data)) {
    respondEscalateJson(400, ['error' => 'Invalid JSON payload.']);
}

$clean = function ($val, int $maxLen = 300): string {
    if (!is_string($val)) return '';
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $val);
    if ($s === null) return '';
    return mb_substr(trim($s), 0, $maxLen, 'UTF-8');
};

$ticketId = $clean($data['ticketId'] ?? '', 24);
if ($ticketId === '' || preg_match('/^#?JD-[A-Z0-9]{4,8}\z/i', $ticketId) !== 1) {
    $ticketId = 'JD-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
}

$visitorName = $clean($data['visitorName'] ?? 'Portfolio Visitor', 80);
$visitorEmail = $clean($data['visitorEmail'] ?? '', 120);
$priority = $clean($data['priority'] ?? 'Normal', 24);
$reason = $clean($data['reason'] ?? 'General Escalation', 120);
$summary = $clean($data['summary'] ?? '', 1200);
$notes = $clean($data['notes'] ?? '', 1200);

if ($visitorEmail !== '' && filter_var($visitorEmail, FILTER_VALIDATE_EMAIL) === false) {
    respondEscalateJson(400, ['error' => 'Please enter a valid email address.']);
}

if ($summary === '' && $notes === '') {
    respondEscalateJson(400, ['error' => 'Please include a summary or note for the escalation.']);
}

// Strip newlines from header-adjacent fields to prevent email header injection
$safeSubjectPart = str_replace(["\r", "\n"], ' ', $reason);
$safeTicketPart = str_replace(["\r", "\n"], '', $ticketId);

$to = 'jacobdavissupport@gmail.com';
$subject = "[{$safeTicketPart}] [{$priority}] Carl Escalation: {$safeSubjectPart}";

$bodyLines = [
    "Heyyo Jacob! Carl escalated a ticket from jacobdavis.tech:",
    "",
    "Case ID: {$ticketId}",
    "Priority: {$priority}",
    "Reason: {$reason}",
    "Visitor Name: " . ($visitorName !== '' ? $visitorName : 'Not provided'),
    "Visitor Email: " . ($visitorEmail !== '' ? $visitorEmail : 'Not provided'),
    "",
    "--- Summary ---",
    $summary !== '' ? $summary : '(No summary provided)',
];

if ($notes !== '') {
    $bodyLines[] = "";
    $bodyLines[] = "--- Visitor Notes ---";
    $bodyLines[] = $notes;
}

$bodyLines[] = "";
$bodyLines[] = "Sent from Carl · jacobdavis.tech";
$body = implode("\r\n", $bodyLines);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Carl Escalations <noreply@jacobdavis.tech>',
];
if ($visitorEmail !== '') {
    $safeReply = str_replace(["\r", "\n"], '', $visitorEmail);
    $headers[] = "Reply-To: {$safeReply}";
}

$sent = false;
if (function_exists('mail')) {
    $sent = @mail($to, $subject, $body, implode("\r\n", $headers));
}

if ($sent) {
    respondEscalateJson(200, [
        'ok' => true,
        'delivered' => true,
        'ticketId' => $ticketId,
        'message' => "Ticket {$ticketId} delivered to Jacob's inbox."
    ]);
} else {
    respondEscalateJson(200, [
        'ok' => true,
        'delivered' => false,
        'ticketId' => $ticketId,
        'message' => "Ticket {$ticketId} logged — use Copy Ticket or Open Email below for direct delivery."
    ]);
}

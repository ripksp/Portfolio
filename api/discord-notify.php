<?php
/**
 * Aegis Dawn // Campaign OS — Spoiler-Free Discord Webhook Notifier
 *
 * Allows the Referee to send in-universe dispatches (e.g. new Patron Contract,
 * Jump Clock alert, or Session 0 ready ping) to the crew's Discord channel
 * without exposing webhook requests to CORS issues.
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

function respondDiscordJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$rawOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$origin = is_string($rawOrigin) ? trim($rawOrigin) : '';
$allowed = ['https://jacobdavis.tech', 'https://www.jacobdavis.tech'];
if ($origin === '') {
    header('Access-Control-Allow-Origin: https://jacobdavis.tech');
} elseif (in_array($origin, $allowed, true) || preg_match('/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?\z/', $origin) === 1) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    respondDiscordJson(403, ['error' => 'Origin not permitted.']);
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respondDiscordJson(405, ['error' => 'Method not allowed.']);
}

$rawInput = file_get_contents('php://input', false, null, 0, 8192);
$body = is_string($rawInput) ? json_decode($rawInput, true) : null;
if (!is_array($body)) {
    respondDiscordJson(400, ['error' => 'Invalid JSON payload.']);
}

$title = isset($body['title']) && is_string($body['title']) ? substr(trim($body['title']), 0, 120) : 'AEGIS DAWN // TRANSMISSION';
$message = isset($body['message']) && is_string($body['message']) ? substr(trim($body['message']), 0, 900) : '';
$campaignUrl = isset($body['campaignUrl']) && is_string($body['campaignUrl']) ? substr(trim($body['campaignUrl']), 0, 240) : 'https://jacobdavis.tech/aegis/';
$imperialDate = isset($body['imperialDate']) && is_string($body['imperialDate']) ? substr(trim($body['imperialDate']), 0, 32) : '1105-042';

if ($message === '') {
    respondDiscordJson(400, ['error' => 'Message is required.']);
}

// Prefer server-side webhook in api/config.php, fallback to Referee-supplied validated Discord URL
define('ALLOWED_ACCESS', true);
$webhookUrl = '';
$configPath = __DIR__ . '/config.php';
if (file_exists($configPath)) {
    $cfg = require $configPath;
    if (is_array($cfg) && !empty($cfg['discord_webhook_url']) && is_string($cfg['discord_webhook_url'])) {
        $webhookUrl = trim($cfg['discord_webhook_url']);
    }
}
if ($webhookUrl === '' && isset($body['webhookUrl']) && is_string($body['webhookUrl'])) {
    $webhookUrl = trim($body['webhookUrl']);
}

// Strict SSRF guard: ONLY genuine Discord webhook URLs permitted
if (preg_match('/^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d{15,22}\/[A-Za-z0-9_-]{30,120}\z/', $webhookUrl) !== 1) {
    respondDiscordJson(400, ['error' => 'Valid Discord webhook URL required (set in Referee Drawer or api/config.php).']);
}

$discordPayload = [
    'username' => 'A.R.I.A. // SS AEGIS DAWN',
    'embeds' => [[
        'title' => "📡 [{$imperialDate}] {$title}",
        'description' => $message . "\n\n**Open Terminal:** {$campaignUrl}",
        'color' => 3407718, // Phosphor green #33FF66
        'footer' => ['text' => 'SS Aegis Dawn / Lucky Break — Spoiler-Free Comms Relay'],
    ]],
];

$ch = curl_init($webhookUrl);
if ($ch === false) {
    respondDiscordJson(500, ['error' => 'Failed to initialize HTTP relay.']);
}
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($discordPayload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

$resp = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($err !== '' || $code < 200 || $code >= 300) {
    respondDiscordJson(502, ['error' => 'Discord webhook rejected dispatch.', 'status' => $code]);
}

respondDiscordJson(200, ['ok' => true, 'dispatched' => true]);

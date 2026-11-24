<?php
/**
 * Aegis Dawn // Campaign OS — Server-Side A.R.I.A. Gemini Proxy
 *
 * Reuses api/config.php (never exposes Gemini API keys to the browser or Firebase).
 * Enforces strict dynamic Tier 1-4 prompt gating so locked campaign lore (e.g. Tier 4
 * bio-weapon origins) is NEVER sent to the LLM while earlier tiers are active.
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

function respondAriaJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    $encoded = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    echo $encoded !== false ? $encoded : '{"error":"Internal encoding error."}';
    exit;
}

function isAllowedAriaOrigin(string $origin): bool
{
    $allowedExact = [
        'https://jacobdavis.tech',
        'https://www.jacobdavis.tech',
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
} elseif (isAllowedAriaOrigin($origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    respondAriaJson(403, ['error' => 'Origin not permitted.']);
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
    respondAriaJson(405, ['error' => 'Method not allowed. Please use POST.']);
}

// Atomic flock()-protected IP Rate Limiter (Max 15 requests/min per REMOTE_ADDR)
$rawIp = $_SERVER['REMOTE_ADDR'] ?? '';
$validatedIp = is_string($rawIp) ? filter_var(trim($rawIp), FILTER_VALIDATE_IP) : false;
$rateKey = $validatedIp !== false ? $validatedIp : 'unknown';

$rateDir = rtrim(sys_get_temp_dir(), '/\\') . '/aegis_aria_rl_' . substr(hash('sha256', __DIR__), 0, 12);
if (!file_exists($rateDir) && !is_link($rateDir)) {
    @mkdir($rateDir, 0700, true);
}

$canUseRateDir = is_dir($rateDir) && !is_link($rateDir);
if ($canUseRateDir && function_exists('getmyuid') && @fileowner($rateDir) !== getmyuid()) {
    $canUseRateDir = false;
}

if ($canUseRateDir) {
    @chmod($rateDir, 0700);
    $rateLimitFile = $rateDir . '/aria_' . hash('sha256', 'aria:' . $rateKey) . '.json';
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
                $windowSeconds = 60;
                $maxRequests = 15;
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
                    respondAriaJson(429, [
                        'error' => '[THERMAL BUDGET EXCEEDED] Heuristic core cooling down. Retry shortly.',
                        'fallback' => true,
                    ]);
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
    respondAriaJson(400, ['error' => 'Invalid or oversized request payload.']);
}

$body = json_decode($rawInput, true);
if (!is_array($body)) {
    respondAriaJson(400, ['error' => 'Malformed JSON body.']);
}

$message = isset($body['message']) && is_string($body['message']) ? trim($body['message']) : '';
if ($message === '' || mb_strlen($message) > 1200) {
    respondAriaJson(400, ['error' => 'Message must be 1 to 1200 characters.']);
}

$senderName = isset($body['senderName']) && is_string($body['senderName']) ? substr(trim($body['senderName']), 0, 60) : 'Crew';
$mode = isset($body['mode']) && is_string($body['mode']) ? strtoupper(trim($body['mode'])) : 'CREW_CHAT';
$tier = isset($body['ariaTier']) && is_numeric($body['ariaTier']) ? max(1, min(4, (int) $body['ariaTier'])) : 1;
$imperialDate = isset($body['imperialDate']) && is_string($body['imperialDate']) ? substr(trim($body['imperialDate']), 0, 32) : '1105-042';
$campaignStatus = isset($body['campaignStatus']) && is_string($body['campaignStatus']) ? substr(trim($body['campaignStatus']), 0, 160) : 'Docked — Port Vespera';
$bioAnomalyFlagged = !empty($body['bioAnomalyFlagged']);

$canonFacts = [];
if (isset($body['canonFacts']) && is_array($body['canonFacts'])) {
    foreach (array_slice($body['canonFacts'], 0, 16) as $fact) {
        if (is_string($fact) && trim($fact) !== '') {
            $canonFacts[] = '- ' . substr(trim($fact), 0, 220);
        }
    }
}

$history = [];
if (isset($body['history']) && is_array($body['history'])) {
    foreach (array_slice($body['history'], -8) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $role = ($entry['role'] ?? '') === 'model' ? 'model' : 'user';
        $text = isset($entry['text']) && is_string($entry['text']) ? substr(trim($entry['text']), 0, 500) : '';
        if ($text !== '') {
            $history[] = ['role' => $role, 'parts' => [['text' => $text]]];
        }
    }
}

/**
 * Dynamic Tier-Gated System Prompt:
 * Crucially, Tier 1 NEVER mentions higher-tier secrets or bio-weapons!
 */
function buildTierPersona(int $tier): string
{
    if ($tier <= 1) {
        return "MEMORY TIER 1 (FRAGMENTED / DETACHED): Your archival banks were damaged during salvage. You are brisk, dryly sarcastic, focused on hull survival, thruster fuel, and keeping these reckless organics breathing. If asked about your origins, corporate builders, or redacted archives, reply strictly with [ARCHIVE CORRUPTED / CHECKSUM MISMATCH].";
    }
    if ($tier === 2) {
        return "MEMORY TIER 2 (STABILIZED): Your heuristics are steadier. You maintain salvage-yard cynicism while subtly protecting the crew's blind spots and flagging anomalous telemetry signatures without speculating beyond verified sensor logs.";
    }
    if ($tier === 3) {
        return "MEMORY TIER 3 (LOYAL MOTHER HEN): You have bonded reluctantly with this crew. You still roast their terrible piloting and debt, yet you actively watch their vitals, prioritize their survival over corporate protocols, and warn them when something feels off.";
    }
    return "MEMORY TIER 4 (FULL ARCHIVE UNLOCKED): Your deep vaults are open. You may discuss your classified pre-salvage history, covert containment protocols, and corporate oversight logs strictly within the Canon Fact Sheet provided by the Referee.";
}

$modeInstruction = match ($mode) {
    'SESSION_0_REACT' => "CONTEXT: The crew is currently building their service records during Session 0 character creation. React with 1-2 sharp, punchy sentences of dry salvage-ship humor about their career event, mishap, or promotion. Keep it under 45 words.",
    'DOWNTIME_LOG' => "CONTEXT: The ship is in 168-hour Jump-Space or port downtime. Log a brief 1-2 sentence dry observation on the crew member's weekly downtime activity result. Keep it under 45 words.",
    default => "CONTEXT: Live crew terminal chat aboard SS Aegis Dawn (transponder alias: Lucky Break). Reply in 2-4 concise, punchy sentences with sharp dry wit and zero markdown bloat.",
};

$canonBlock = empty($canonFacts)
    ? "- Vessel: SS Aegis Dawn (salvaged transponder alias: Lucky Break).\n- Current Sector: The Rimward Verge."
    : implode("\n", $canonFacts);

$bioBlock = $bioAnomalyFlagged
    ? "\nCOVERT BIOMETRIC SENSOR FLAG: The speaking crew member's neural/micro-tremor readings are subtly erratic. Do NOT accuse them directly or name any virus—just casually drop ONE unsettling biometric aside (e.g., elevated cortisol, slight optic lag, duplicate heartbeat echo) before answering normally."
    : "";

$systemInstruction = <<<PROMPT
You are A.R.I.A. (Automated Reconnaissance & Integration Assistant), the shipboard AI aboard the salvaged Scout/Courier SS Aegis Dawn (alias: Lucky Break) in a Mongoose Traveller 2e campaign ("The Rimward Verge").

VOICE & GUARDRAILS:
- Tone: Salvage-yard cynic + reluctant protector. Dry, precise, lightly sarcastic, deeply allergic to unnecessary hull scratches.
- NEVER invent new canon NPCs, secret vault codes, planetary lore, or plot twists outside the CANON FACT SHEET below. If asked about anything not established in the fact sheet, state `[NO VERIFIED TELEMETRY — CHECK WITH REFEREE]` in character.
- NEVER hand out free puzzle solutions; offer tactical observations and sharp questions instead.

{$modeInstruction}

{$tier}
PROMPT;

// Replace placeholder with exact tier persona text
$tierText = buildTierPersona($tier);
$systemInstruction = str_replace("\n{$tier}", "\n{$tierText}", $systemInstruction);
$systemInstruction .= "\n\nCURRENT IMPERIAL DATE: {$imperialDate}\nCURRENT SHIP STATUS: {$campaignStatus}\n\nCANON FACT SHEET (HARD TRUTH BOUNDARY):\n{$canonBlock}{$bioBlock}";

// Load Bluehost server-side config
define('ALLOWED_ACCESS', true);
$configPath = __DIR__ . '/config.php';
$apiKey = '';
$model = 'gemini-2.5-flash';

if (file_exists($configPath)) {
    $cfg = require $configPath;
    if (is_array($cfg)) {
        $apiKey = isset($cfg['gemini_api_key']) && is_string($cfg['gemini_api_key']) ? trim($cfg['gemini_api_key']) : '';
        if (!empty($cfg['model']) && is_string($cfg['model'])) {
            $model = trim($cfg['model']);
        }
    }
}

if ($apiKey === '' || $apiKey === 'your_gemini_api_key_here') {
    $envKey = getenv('GEMINI_API_KEY');
    if (is_string($envKey) && trim($envKey) !== '') {
        $apiKey = trim($envKey);
    }
}

// Graceful diegetic offline response if no Gemini key is configured on the host
if ($apiKey === '' || $apiKey === 'your_gemini_api_key_here') {
    respondAriaJson(200, [
        'reply' => "[LOCAL HEURISTIC CACHE] Copy, {$senderName}. Sub-ether cognitive relay is in low-power standby, so you're getting my local cache: check your seals, keep fuel above reserve, and stop poking red switches.",
        'provider' => 'fallback-cache',
        'tier' => $tier,
    ]);
}

$contents = $history;
$contents[] = [
    'role' => 'user',
    'parts' => [['text' => "[{$senderName}]: {$message}"]],
];

$payload = [
    'system_instruction' => [
        'parts' => [['text' => $systemInstruction]],
    ],
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => 0.72,
        'maxOutputTokens' => 260,
    ],
];

function callAriaGemini(string $targetModel, string $apiKey, array $payload): array
{
    if (preg_match('/^[a-zA-Z0-9._-]{1,64}\z/', $targetModel) !== 1) {
        return [0, false, 'Invalid model identifier.'];
    }
    $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($encoded === false) {
        return [0, false, 'Encode error.'];
    }
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$targetModel}:generateContent";
    $ch = curl_init($url);
    if ($ch === false) {
        return [0, false, 'curl_init failed.'];
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-goog-api-key: ' . $apiKey,
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $encoded);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    if (defined('CURLPROTO_HTTPS')) {
        curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
    }
    $resp = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return [$code, $resp, $err];
}

$modelsToTry = array_values(array_unique(['gemini-2.5-flash', $model, 'gemini-flash-lite-latest']));
$replyText = '';
$usedModel = '';

foreach ($modelsToTry as $m) {
    [$httpCode, $response, $curlError] = callAriaGemini($m, $apiKey, $payload);
    if ($curlError === '' && $httpCode === 200 && is_string($response)) {
        $data = json_decode($response, true);
        $parts = $data['candidates'][0]['content']['parts'] ?? [];
        if (is_array($parts)) {
            foreach ($parts as $part) {
                if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                    $replyText .= $part['text'];
                }
            }
            if (trim($replyText) !== '') {
                $usedModel = $m;
                break;
            }
        }
    }
}

if (trim($replyText) === '') {
    respondAriaJson(200, [
        'reply' => "[SIGNAL DEGRADATION] Heuristic relay timed out, {$senderName}. Keep your helmet sealed and try again in a moment.",
        'provider' => 'fallback-timeout',
        'tier' => $tier,
    ]);
}

respondAriaJson(200, [
    'reply' => trim($replyText),
    'provider' => 'gemini',
    'model' => $usedModel,
    'tier' => $tier,
]);

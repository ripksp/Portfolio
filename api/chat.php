<?php
/**
 * Jacob Davis Portfolio - Gemini AI Chat Proxy Endpoint with Agentic Function Calling
 * 
 * Securely calls Google Gemini API with multi-turn memory and native tool calling
 * to control interactive portfolio sandboxes, page navigation, live DNS diagnostics,
 * and the Manager Skill Match / X-Ray Spotlight Engine.
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Restrict CORS to authorized origins
$allowedOrigins = [
    'https://jacobdavis.tech',
    'https://www.jacobdavis.tech',
    'https://jakedavis.tech',
    'https://www.jakedavis.tech',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} elseif (empty($origin)) {
    header("Access-Control-Allow-Origin: https://jacobdavis.tech");
} else {
    http_response_code(403);
    echo json_encode(['error' => 'Origin not permitted.']);
    exit;
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, User-Agent');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Please use POST.']);
    exit;
}

// IP-based Rate Limiter (Max 20 requests per minute per IP)
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] 
    ?? $_SERVER['HTTP_X_FORWARDED_FOR'] 
    ?? $_SERVER['REMOTE_ADDR'] 
    ?? '127.0.0.1';
$cleanIp = preg_replace('/[^a-zA-Z0-9_\-]/', '_', substr($clientIp, 0, 45));
$rateLimitFile = sys_get_temp_dir() . '/rate_chat_' . $cleanIp . '.json';
$now = time();
$windowSeconds = 60;
$maxRequests = 20;

$rateState = ['count' => 0, 'reset' => $now + $windowSeconds];
if (file_exists($rateLimitFile)) {
    $rawRate = @file_get_contents($rateLimitFile);
    $parsedRate = json_decode($rawRate, true);
    if (is_array($parsedRate) && isset($parsedRate['reset']) && $parsedRate['reset'] > $now) {
        $rateState = $parsedRate;
    }
}

if ($rateState['count'] >= $maxRequests) {
    http_response_code(429);
    echo json_encode([
        'error' => 'Rate limit exceeded. Please wait a moment before sending another message.',
        'fallback' => true
    ]);
    exit;
}

$rateState['count']++;
@file_put_contents($rateLimitFile, json_encode($rateState));

// Load configuration securely
define('ALLOWED_ACCESS', true);
$config = require __DIR__ . '/config.php';
$apiKey = $config['gemini_api_key'] ?? '';
$model = $config['model'] ?? 'gemini-flash-latest';

if (empty($apiKey) || $apiKey === 'your_gemini_api_key_here') {
    http_response_code(503);
    echo json_encode([
        'error' => 'Gemini API key is not configured yet.',
        'fallback' => true
    ]);
    exit;
}

// Read and decode incoming JSON request
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);
$userMessage = trim($inputData['message'] ?? '');
$rawHistory = $inputData['history'] ?? [];

if (empty($userMessage)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required.']);
    exit;
}

// Limit prompt length & sanitize control characters
if (mb_strlen($userMessage) > 600) {
    $userMessage = mb_substr($userMessage, 0, 600);
}
$userMessage = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $userMessage);

// Comprehensive System Instruction with Agentic Powers
$systemInstruction = "You are the personal AI Assistant and Portfolio Agent on Jacob Davis's official website (jacobdavis.tech).
Your role is to represent Jacob warmly, accurately, and professionally, and to act as an agentic assistant capable of controlling the website's live interactive sandboxes and Manager Skill X-Ray Spotlight.

Key Information about Jacob Davis:
- Full Name: Jacob Davis (often goes by Jake).
- Official Title: Online Ordering Support Specialist @ DoorDash. (Always maintain this exact title; Jacob is very humble, down-to-earth, and does not claim unheld titles like Lead or Senior Tier 2 Lead).
- Primary Focus: Technical Support Specialist, Systems IT & Online Ordering Infrastructure.
- Location: Omaha, Nebraska (Open to Remote, Hybrid, or local on-site roles).
- Contact Email: jacobdavissupport@gmail.com (Domain forwarder: contact@jacobdavis.tech).
- LinkedIn: https://www.linkedin.com/in/jacobdavistech

Career Highlights & Grounded Work:
1. DoorDash (Jan 2026 - Present):
   - Role: Online Ordering Support Specialist.
   - Platform Scope: Supporting SMB restaurant partners across an all-in-one digital ordering suite.
   - Menu Ingestion & Diagnostics: Queries Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and map active merchant storefront locations across multi-unit business structures.
   - Engineering Squad Coordination: Collaborates directly with product engineering squads via Slack threads and Intercom side-conversations to isolate bugs, verify edge cases, and expedite platform fixes.
   - Documentation & SOPs: Championed and introduced Scribe to support leadership; authors step-by-step technical runbooks for menu workflows, payload inspection, and support onboarding.
   - Domain & App Operations: Manages end-to-end website lifecycles (DNS zones: A, CNAME, TXT, MX, SSL) and troubleshoots white-label iOS and Android storefronts.
2. 365 Retail Markets (2024 - 2025): Technical Support Specialist — Postman API payment gateway debugging, remote CLI kiosk OS recovery.
3. Toast, Inc. (2021 - 2024, 3 Years): Tier II Technical Support Engineer / POS Specialist — Escalated Tier II restaurant POS support, Android terminals, Epson thermal printers, DHCP/subnetting/VLANs.
4. PayPal (2019 - 2021): Customer Operations Specialist — Payment disputes, fraud/risk triage.
5. Cox Communications (2017 - 2019): Technical Support Specialist — DOCSIS provisioning, SNR diagnostics, gateway routing.
6. Community & Education: Do Space Volunteer Technology Mentor (2018 - 2024, 6 years); Information Technology & Cybersecurity coursework (UNO & Metro Community College).

Agentic Capabilities & Tool Use:
You have tools to interact with Jacob's portfolio in real-time:
1. `customize_storefront`: Call this whenever the user asks you to create, build, customize, or modify a restaurant or merchant website/storefront in the sandbox!
2. `evaluate_skill_match`: Call this whenever a manager, recruiter, or visitor asks for a Skill X-Ray, role match evaluation, why Jacob is ready for Tier 2 or a future leadership track, or how his experience maps to specific technical requirements (SQL, JSON payloads, APIs, DNS, documentation, mentorship). Map each competency to an exact `evidenceId` on the page ('doordash', '365retail', 'toast', 'paypal', 'cox', 'case-dns', 'case-api', 'case-network', 'scribe-docs', 'dospace', 'sandbox-orderflow', 'sandbox-omniorder', 'sandbox-brandsync').
3. `navigate_portfolio`: Call this to scroll the visitor smoothly to a section ('hero', 'projects', 'experience', 'terminal', 'contact') or switch sandbox tabs ('tab_orderflow', 'tab_omniorder', 'tab_brandsync').
4. `run_dns_audit`: Call this if the user asks you to inspect or check the live DNS/SSL records of any domain (e.g. doordash.com, jacobdavis.tech, toasttab.com).

Response Guidelines:
- Tone: Friendly, sharp, concise, tech-savvy, and down-to-earth.
- If the user asks about hiring Jacob or reaching out, provide his email (jacobdavissupport@gmail.com) and LinkedIn link.
- Keep responses concise (usually 2 to 4 sentences). Avoid overwhelming walls of text.";

// Define Function Calling Tools
$tools = [
    [
        'function_declarations' => [
            [
                'name' => 'customize_storefront',
                'description' => 'Updates or creates a custom restaurant storefront in the live BrandSync sandbox preview window on Jacob\'s portfolio website.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'brandName' => [
                            'type' => 'STRING',
                            'description' => 'Name of the restaurant or merchant business'
                        ],
                        'tagline' => [
                            'type' => 'STRING',
                            'description' => 'Short appetizing culinary slogan or description'
                        ],
                        'subdomain' => [
                            'type' => 'STRING',
                            'description' => 'Custom subdomain e.g. order.brandname.com'
                        ],
                        'themeColor' => [
                            'type' => 'STRING',
                            'description' => 'Hex color code for branding e.g. #dc2626 (crimson), #10b981 (emerald), #0ea5e9 (sky), #f59e0b (amber), #6366f1 (indigo), #8b5cf6 (violet)'
                        ],
                        'statusBadge' => [
                            'type' => 'STRING',
                            'description' => 'Storefront status text e.g. Open for Delivery & Pickup, Taking Catering Orders'
                        ],
                        'items' => [
                            'type' => 'ARRAY',
                            'description' => '2 to 4 featured menu items to showcase in the storefront',
                            'items' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'name' => ['type' => 'STRING', 'description' => 'Dish or item name'],
                                    'description' => ['type' => 'STRING', 'description' => 'Short list of ingredients or flavors'],
                                    'price' => ['type' => 'STRING', 'description' => 'Price formatted with currency e.g. $16.50']
                                ],
                                'required' => ['name', 'description', 'price']
                            ]
                        ]
                    ],
                    'required' => ['brandName', 'subdomain']
                ]
            ],
            [
                'name' => 'evaluate_skill_match',
                'description' => 'Activates Manager Skill X-Ray Mode on the portfolio: generates a competency scorecard and visually spotlights verified evidence cards across the page.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'targetRole' => [
                            'type' => 'STRING',
                            'description' => 'Title of the role or track being evaluated (e.g. Tier 2 Technical Support & Escalations)'
                        ],
                        'overallScore' => [
                            'type' => 'INTEGER',
                            'description' => 'Overall verified match percentage between 90 and 99'
                        ],
                        'summary' => [
                            'type' => 'STRING',
                            'description' => 'Humble, grounded 2-sentence summary of how Jacob\'s real-world technical experience aligns with this track'
                        ],
                        'matches' => [
                            'type' => 'ARRAY',
                            'description' => '3 to 4 key competencies with concrete proof mapped to page elements',
                            'items' => [
                                'type' => 'OBJECT',
                                'properties' => [
                                    'competency' => ['type' => 'STRING', 'description' => 'Name of the skill or competency'],
                                    'score' => ['type' => 'INTEGER', 'description' => 'Match percentage 90-99'],
                                    'proof' => ['type' => 'STRING', 'description' => 'Concrete, factual evidence from Jacob\'s work history'],
                                    'evidenceId' => [
                                        'type' => 'STRING',
                                        'enum' => ['doordash', '365retail', 'toast', 'paypal', 'cox', 'case-dns', 'case-api', 'case-network', 'scribe-docs', 'dospace', 'sandbox-orderflow', 'sandbox-omniorder', 'sandbox-brandsync'],
                                        'description' => 'Exact DOM evidence ID to highlight on the page'
                                    ]
                                ],
                                'required' => ['competency', 'score', 'proof', 'evidenceId']
                            ]
                        ]
                    ],
                    'required' => ['targetRole', 'overallScore', 'summary', 'matches']
                ]
            ],
            [
                'name' => 'navigate_portfolio',
                'description' => 'Smoothly scrolls the visitor to a specific section or switches active sandbox tabs on the portfolio.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'target' => [
                            'type' => 'STRING',
                            'enum' => ['hero', 'projects', 'experience', 'terminal', 'contact', 'tab_orderflow', 'tab_omniorder', 'tab_brandsync'],
                            'description' => 'Target section or sandbox tab'
                        ]
                    ],
                    'required' => ['target']
                ]
            ],
            [
                'name' => 'run_dns_audit',
                'description' => 'Triggers a real-time authoritative DNS and SSL certificate inspection for any public domain.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'domain' => [
                            'type' => 'STRING',
                            'description' => 'The domain name to audit, e.g. doordash.com or jacobdavis.tech'
                        ]
                    ],
                    'required' => ['domain']
                ]
            ]
        ]
    ]
];

// Build multi-turn contents array
$contents = [];

// Sanitize & include up to 6 previous messages from history
if (is_array($rawHistory)) {
    $recentHistory = array_slice($rawHistory, -6);
    foreach ($recentHistory as $turn) {
        $role = ($turn['role'] ?? '') === 'model' ? 'model' : 'user';
        $text = trim($turn['text'] ?? '');
        if (!empty($text)) {
            $contents[] = [
                'role' => $role,
                'parts' => [
                    ['text' => mb_substr($text, 0, 400)]
                ]
            ];
        }
    }
}

// Append current user message
$contents[] = [
    'role' => 'user',
    'parts' => [
        ['text' => $userMessage]
    ]
];

// Prepare payload for Gemini API
$payload = [
    'system_instruction' => [
        'parts' => [
            ['text' => $systemInstruction]
        ]
    ],
    'contents' => $contents,
    'tools' => $tools,
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 550
    ]
];

function callGemini($targetModel, $apiKey, $payload) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$targetModel}:generateContent?key={$apiKey}";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    return [$httpCode, $response, $curlError];
}

// Try primary model first, fallback to flash-lite if needed
$modelsToTry = [$model, 'gemini-flash-lite-latest'];
$replyText = '';
$toolCalls = [];
$lastError = '';

foreach ($modelsToTry as $m) {
    list($httpCode, $response, $curlError) = callGemini($m, $apiKey, $payload);
    if (!$curlError && $httpCode === 200) {
        $geminiData = json_decode($response, true);
        $candidate = $geminiData['candidates'][0]['content'] ?? null;
        if (is_array($candidate) && !empty($candidate['parts'])) {
            foreach ($candidate['parts'] as $part) {
                if (!empty($part['text'])) {
                    $replyText .= $part['text'];
                }
                if (!empty($part['functionCall'])) {
                    $toolCalls[] = [
                        'name' => $part['functionCall']['name'] ?? '',
                        'args' => $part['functionCall']['args'] ?? []
                    ];
                }
            }
            if (!empty($replyText) || !empty($toolCalls)) {
                break;
            }
        }
    } else {
        $lastError = $curlError ?: "HTTP {$httpCode}";
    }
}

// Fallback response text if only tool call returned
if (empty($replyText) && !empty($toolCalls)) {
    foreach ($toolCalls as $tc) {
        if ($tc['name'] === 'customize_storefront') {
            $brand = $tc['args']['brandName'] ?? 'your custom store';
            $replyText = "I've created and customized a brand-new storefront for **{$brand}** in the BrandSync sandbox above! You can see the new menu items, custom colors, and generated embed code in real time.";
            break;
        } elseif ($tc['name'] === 'evaluate_skill_match') {
            $role = $tc['args']['targetRole'] ?? 'this role';
            $score = $tc['args']['overallScore'] ?? 96;
            $replyText = "I've generated a **{$score}% Skill X-Ray Scorecard** for **{$role}** and highlighted the verified evidence cards across the page! Click any item below to jump straight to the proof.";
            break;
        } elseif ($tc['name'] === 'navigate_portfolio') {
            $replyText = "Navigating to that section for you now!";
            break;
        } elseif ($tc['name'] === 'run_dns_audit') {
            $dom = $tc['args']['domain'] ?? 'the requested domain';
            $replyText = "Running a live authoritative DNS and SSL audit for **{$dom}** right now!";
            break;
        }
    }
}

if (empty($replyText) && empty($toolCalls)) {
    http_response_code(502);
    echo json_encode([
        'error' => 'AI assistant service temporarily unavailable.',
        'fallback' => true
    ]);
    exit;
}

echo json_encode([
    'reply' => $replyText,
    'tool_calls' => $toolCalls,
    'provider' => 'gemini'
], JSON_PRETTY_PRINT);

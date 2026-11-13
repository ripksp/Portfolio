<?php
/**
 * Jacob Davis Portfolio - Live Real-Time DNS & SSL Diagnostic Endpoint
 * 
 * Performs real-time DNS queries (A, AAAA, CNAME, MX, TXT, NS) and SSL handshake audits
 * for any publicly resolvable domain. Built to power live domain diagnostics on jacobdavis.tech.
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// CORS configuration
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
    echo json_encode(['status' => 'error', 'message' => 'Origin not permitted.']);
    exit;
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, User-Agent');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// IP-based Rate Limiter (Max 30 requests per minute per IP)
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] 
    ?? $_SERVER['HTTP_X_FORWARDED_FOR'] 
    ?? $_SERVER['REMOTE_ADDR'] 
    ?? '127.0.0.1';
$cleanIp = preg_replace('/[^a-zA-Z0-9_\-]/', '_', substr($clientIp, 0, 45));
$rateLimitFile = sys_get_temp_dir() . '/rate_dns_' . $cleanIp . '.json';
$now = time();
$windowSeconds = 60;
$maxRequests = 30;

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
        'status' => 'error',
        'message' => 'Rate limit exceeded. Please wait a moment before running another DNS audit.'
    ]);
    exit;
}

$rateState['count']++;
@file_put_contents($rateLimitFile, json_encode($rateState));

// Robust domain extraction from GET, POST, JSON body, or QUERY_STRING
$startTime = microtime(true);
$rawInput = file_get_contents('php://input');
$inputData = !empty($rawInput) ? json_decode($rawInput, true) : null;

$rawDomain = $_GET['domain'] 
    ?? $_POST['domain'] 
    ?? $_REQUEST['domain'] 
    ?? ($inputData['domain'] ?? '');

if (empty($rawDomain) && !empty($_SERVER['QUERY_STRING'])) {
    parse_str($_SERVER['QUERY_STRING'], $parsedQs);
    $rawDomain = $parsedQs['domain'] ?? '';
}

$domain = trim((string)$rawDomain);

// Strip protocol if supplied (http://, https://)
$domain = preg_replace('~^https?://~i', '', $domain);
// Strip trailing path/query/fragment
$domain = preg_replace('~[/?#].*$~', '', $domain);
// Strip port if supplied (:443, :80)
$domain = preg_replace('~:\d+$~', '', $domain);
$domain = strtolower(trim($domain));

if (empty($domain)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Domain parameter is required (e.g. ?domain=jacobdavis.tech).'
    ]);
    exit;
}

if (strlen($domain) > 253) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Domain name exceeds maximum RFC length of 253 characters.'
    ]);
    exit;
}

// Strict domain regex validation (RFC 1035 / RFC 1123)
if (!preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i', $domain)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid domain syntax. Please enter a valid fully qualified domain name (e.g. doordash.com or jacobdavis.tech).'
    ]);
    exit;
}

// Disallow reserved, local, or private TLDs
$parts = explode('.', $domain);
$tld = end($parts);
$blockedTlds = ['local', 'internal', 'lan', 'home', 'corp', 'test', 'invalid', 'example', 'localhost'];
if (in_array($tld, $blockedTlds, true) || $domain === 'localhost' || $domain === '127.0.0.1') {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Queries for private or local hostnames are disallowed.'
    ]);
    exit;
}

// Query DNS records across major record types
$dnsResults = [
    'a' => [],
    'aaaa' => [],
    'cname' => [],
    'mx' => [],
    'txt' => [],
    'ns' => []
];

// Query A, AAAA, CNAME, MX, TXT, NS
$rawRecords = @dns_get_record($domain, DNS_A + DNS_AAAA + DNS_CNAME + DNS_MX + DNS_TXT + DNS_NS);

if (is_array($rawRecords)) {
    foreach ($rawRecords as $rec) {
        $type = strtoupper($rec['type'] ?? '');
        $ttl = $rec['ttl'] ?? 300;

        switch ($type) {
            case 'A':
                if (!empty($rec['ip'])) {
                    $dnsResults['a'][] = [
                        'ip' => $rec['ip'],
                        'ttl' => $ttl
                    ];
                }
                break;
            case 'AAAA':
                if (!empty($rec['ipv6'])) {
                    $dnsResults['aaaa'][] = [
                        'ipv6' => $rec['ipv6'],
                        'ttl' => $ttl
                    ];
                }
                break;
            case 'CNAME':
                if (!empty($rec['target'])) {
                    $dnsResults['cname'][] = [
                        'target' => $rec['target'],
                        'ttl' => $ttl
                    ];
                }
                break;
            case 'MX':
                if (!empty($rec['target'])) {
                    $dnsResults['mx'][] = [
                        'target' => $rec['target'],
                        'pri' => $rec['pri'] ?? 10,
                        'ttl' => $ttl
                    ];
                }
                break;
            case 'TXT':
                if (!empty($rec['txt'])) {
                    $dnsResults['txt'][] = [
                        'txt' => substr($rec['txt'], 0, 255),
                        'ttl' => $ttl
                    ];
                }
                break;
            case 'NS':
                if (!empty($rec['target'])) {
                    $dnsResults['ns'][] = [
                        'target' => $rec['target'],
                        'ttl' => $ttl
                    ];
                }
                break;
        }
    }
}

// Fallback: if dns_get_record returned empty A records, try gethostbynamel
if (empty($dnsResults['a']) && empty($dnsResults['cname'])) {
    $ips = @gethostbynamel($domain);
    if (is_array($ips)) {
        foreach ($ips as $ip) {
            $dnsResults['a'][] = [
                'ip' => $ip,
                'ttl' => 300
            ];
        }
    }
}

// Check authoritative nameservers if NS wasn't returned on subdomain
if (empty($dnsResults['ns']) && count($parts) > 2) {
    // Try parent root domain for NS
    $rootDomain = implode('.', array_slice($parts, -2));
    $rootNs = @dns_get_record($rootDomain, DNS_NS);
    if (is_array($rootNs)) {
        foreach ($rootNs as $rec) {
            if (!empty($rec['target'])) {
                $dnsResults['ns'][] = [
                    'target' => $rec['target'],
                    'ttl' => $rec['ttl'] ?? 300,
                    'inherited_from' => $rootDomain
                ];
            }
        }
    }
}

// SSL Certificate Handshake & Inspector
$sslInfo = [
    'status' => 'NONE',
    'issuer' => 'None / Not Responding on Port 443',
    'subject' => null,
    'valid_from' => null,
    'valid_to' => null,
    'days_remaining' => null,
    'is_expired' => false,
    'san' => []
];

$streamContext = stream_context_create([
    'ssl' => [
        'capture_peer_cert' => true,
        'verify_peer' => false,
        'verify_peer_name' => false,
        'SNI_enabled' => true,
        'peer_name' => $domain
    ]
]);

$errno = 0;
$errstr = '';
$socket = @stream_socket_client(
    "ssl://{$domain}:443",
    $errno,
    $errstr,
    3.0,
    STREAM_CLIENT_CONNECT,
    $streamContext
);

if ($socket) {
    $params = stream_context_get_params($socket);
    if (!empty($params['options']['ssl']['peer_certificate'])) {
        $cert = openssl_x509_parse($params['options']['ssl']['peer_certificate']);
        if (is_array($cert)) {
            $validTo = $cert['validTo_time_t'] ?? 0;
            $validFrom = $cert['validFrom_time_t'] ?? 0;
            $issuerOrg = $cert['issuer']['O'] ?? $cert['issuer']['CN'] ?? 'Unknown Authority';
            $subjectCN = $cert['subject']['CN'] ?? $domain;
            $daysLeft = round(($validTo - time()) / 86400);

            // Extract SANs (Subject Alternative Names)
            $sans = [];
            if (!empty($cert['extensions']['subjectAltName'])) {
                $rawSans = explode(',', $cert['extensions']['subjectAltName']);
                foreach ($rawSans as $s) {
                    $s = trim(str_replace('DNS:', '', $s));
                    if (!empty($s) && !in_array($s, $sans, true)) {
                        $sans[] = $s;
                    }
                }
            }

            $isExpired = ($validTo <= time());

            $sslInfo = [
                'status' => $isExpired ? 'EXPIRED' : 'ACTIVE',
                'issuer' => $issuerOrg,
                'subject' => $subjectCN,
                'valid_from' => $validFrom ? date('Y-m-d', $validFrom) : null,
                'valid_to' => $validTo ? date('Y-m-d', $validTo) : null,
                'days_remaining' => (int)$daysLeft,
                'is_expired' => $isExpired,
                'san' => array_slice($sans, 0, 5)
            ];
        }
    }
    @fclose($socket);
}

$queryTimeMs = round((microtime(true) - $startTime) * 1000, 1);
$hasRecords = !empty($dnsResults['a']) || !empty($dnsResults['cname']) || !empty($dnsResults['mx']) || !empty($dnsResults['ns']);

echo json_encode([
    'status' => 'success',
    'domain' => $domain,
    'query_time_ms' => $queryTimeMs,
    'has_records' => $hasRecords,
    'dns' => $dnsResults,
    'ssl' => $sslInfo,
    'server_resolver' => 'Bluehost Authoritative DNS Resolver',
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
], JSON_PRETTY_PRINT);

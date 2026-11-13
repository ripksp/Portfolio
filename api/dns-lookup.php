<?php
/**
 * Jacob Davis Portfolio - Live Real-Time DNS & SSL Diagnostic Endpoint
 *
 * Performs real-time recursive DNS queries (A, AAAA, CNAME, MX, TXT, NS) and
 * anti-TOCTOU direct-IP TLS handshake audits for publicly resolvable domains.
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

function respondDnsJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    $encoded = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    echo $encoded !== false ? $encoded : '{"status":"error","error":"Internal encoding error.","message":"Internal encoding error."}';
    exit;
}

function respondDnsError(int $statusCode, string $message): never
{
    respondDnsJson($statusCode, [
        'status' => 'error',
        'error' => $message,
        'message' => $message,
    ]);
}

function isAllowedDnsOrigin(string $origin): bool
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

function binIpInCidr(string $binIp, string $cidrNetwork, int $prefixLen): bool
{
    $binNet = @inet_pton($cidrNetwork);
    if ($binNet === false || strlen($binIp) !== strlen($binNet)) {
        return false;
    }

    $fullBytes = intdiv($prefixLen, 8);
    $remBits = $prefixLen % 8;

    if ($fullBytes > 0 && substr($binIp, 0, $fullBytes) !== substr($binNet, 0, $fullBytes)) {
        return false;
    }

    if ($remBits > 0) {
        $mask = (0xFF << (8 - $remBits)) & 0xFF;
        if ((ord($binIp[$fullBytes]) & $mask) !== (ord($binNet[$fullBytes]) & $mask)) {
            return false;
        }
    }

    return true;
}

function isPublicIp(string $ip): bool
{
    $ip = trim($ip);
    if ($ip === '') {
        return false;
    }

    // Strip IPv6 zone index (e.g. fe80::1%eth0) -> always reject zone-scoped addresses
    if (str_contains($ip, '%')) {
        return false;
    }

    $bin = @inet_pton($ip);
    if ($bin === false) {
        return false;
    }

    if (strlen($bin) === 4) {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return false;
        }

        $blockedV4Cidrs = [
            ['0.0.0.0', 8],
            ['10.0.0.0', 8],
            ['100.64.0.0', 10],
            ['127.0.0.0', 8],
            ['169.254.0.0', 16],
            ['172.16.0.0', 12],
            ['192.0.0.0', 24],
            ['192.0.2.0', 24],
            ['192.168.0.0', 16],
            ['198.18.0.0', 15],
            ['198.51.100.0', 24],
            ['203.0.113.0', 24],
            ['224.0.0.0', 4],
            ['240.0.0.0', 4],
        ];

        foreach ($blockedV4Cidrs as [$network, $prefix]) {
            if (binIpInCidr($bin, $network, $prefix)) {
                return false;
            }
        }

        return true;
    }

    if (strlen($bin) === 16) {
        // Unpack embedded IPv4 from ::ffff:0:0/96 (IPv4-mapped IPv6)
        if (binIpInCidr($bin, '::ffff:0:0', 96)) {
            $embeddedV4 = @inet_ntop(substr($bin, 12, 4));
            return is_string($embeddedV4) && isPublicIp($embeddedV4);
        }

        // Unpack embedded IPv4 from 2002::/16 (6to4)
        if (binIpInCidr($bin, '2002::', 16)) {
            $embeddedV4 = @inet_ntop(substr($bin, 2, 4));
            return is_string($embeddedV4) && isPublicIp($embeddedV4);
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return false;
        }

        $blockedV6Cidrs = [
            ['::', 128],
            ['::1', 128],
            ['::', 96],
            ['64:ff9b::', 96],
            ['64:ff9b:1::', 48],
            ['100::', 64],
            ['2001::', 32],
            ['2001:2::', 48],
            ['2001:db8::', 32],
            ['fc00::', 7],
            ['fe80::', 10],
            ['ff00::', 8],
        ];

        foreach ($blockedV6Cidrs as [$network, $prefix]) {
            if (binIpInCidr($bin, $network, $prefix)) {
                return false;
            }
        }

        return true;
    }

    return false;
}

function isBlockedHostnameOrTld(string $hostname): bool
{
    $host = rtrim(strtolower(trim($hostname)), '.');
    if ($host === '' || $host === 'localhost') {
        return true;
    }

    $parts = explode('.', $host);
    $tld = end($parts);
    $blockedTlds = [
        'localhost',
        'local',
        'internal',
        'lan',
        'home',
        'corp',
        'test',
        'invalid',
        'example',
        'arpa',
        'localdomain',
        'intranet',
        'private',
        'onion',
        'alt',
    ];

    return in_array($tld, $blockedTlds, true);
}

// CORS configuration
$rawOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$origin = is_string($rawOrigin) ? trim($rawOrigin) : '';

if ($origin === '') {
    header('Access-Control-Allow-Origin: https://jacobdavis.tech');
} elseif (isAllowedDnsOrigin($origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    respondDnsError(403, 'Origin not permitted.');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, User-Agent');
header('Access-Control-Max-Age: 86400');

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!in_array($requestMethod, ['GET', 'POST'], true)) {
    respondDnsError(405, 'Method not allowed. Please use GET or POST.');
}

// Atomic flock()-protected IP Rate Limiter (Max 30 requests per minute per REMOTE_ADDR)
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
    $rateLimitFile = $rateDir . '/dns_' . hash('sha256', 'dns:' . $rateKey) . '.json';
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
                $maxRequests = 30;
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
                    respondDnsError(429, 'Rate limit exceeded. Please wait a moment before running another DNS audit.');
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

// Type-safe domain extraction from GET, POST, JSON body, or QUERY_STRING
$startTime = microtime(true);
$rawDomain = null;

if (array_key_exists('domain', $_GET)) {
    if (!is_string($_GET['domain'])) {
        respondDnsError(400, 'Domain parameter must be a string.');
    }
    $rawDomain = $_GET['domain'];
}

if ($rawDomain === null && array_key_exists('domain', $_POST)) {
    if (!is_string($_POST['domain'])) {
        respondDnsError(400, 'Domain parameter must be a string.');
    }
    $rawDomain = $_POST['domain'];
}

if ($rawDomain === null && $requestMethod === 'POST') {
    $rawInput = file_get_contents('php://input', false, null, 0, 8193);
    if ($rawInput !== false && strlen($rawInput) <= 8192 && trim($rawInput) !== '') {
        $inputData = json_decode($rawInput, true, 8);
        if (is_array($inputData) && array_key_exists('domain', $inputData)) {
            if (!is_string($inputData['domain'])) {
                respondDnsError(400, 'Domain parameter must be a string.');
            }
            $rawDomain = $inputData['domain'];
        }
    }
}

if ($rawDomain === null && !empty($_SERVER['QUERY_STRING']) && is_string($_SERVER['QUERY_STRING'])) {
    parse_str($_SERVER['QUERY_STRING'], $parsedQs);
    if (is_array($parsedQs) && array_key_exists('domain', $parsedQs)) {
        if (!is_string($parsedQs['domain'])) {
            respondDnsError(400, 'Domain parameter must be a string.');
        }
        $rawDomain = $parsedQs['domain'];
    }
}

$domainInput = is_string($rawDomain) ? $rawDomain : '';
if (!mb_check_encoding($domainInput, 'UTF-8')) {
    respondDnsError(400, 'Domain parameter must be valid UTF-8.');
}

$domain = trim($domainInput);

// Strip protocol if supplied (http://, https://)
$domain = preg_replace('~^https?://~i', '', $domain) ?? $domain;
// Strip trailing path/query/fragment
$domain = preg_replace('~[/?#].*$~', '', $domain) ?? $domain;
// Strip port if supplied (:443, :80)
$domain = preg_replace('~:\d+$~', '', $domain) ?? $domain;
$domain = strtolower(trim($domain));

if ($domain === '') {
    respondDnsError(400, 'Domain parameter is required (e.g. ?domain=jacobdavis.tech).');
}

// Reject double dots (e.g. jacobdavis.tech.. or a..b.com) before normalizing trailing root dot
if (str_contains($domain, '..')) {
    respondDnsError(400, 'Invalid domain syntax. Consecutive dots are not permitted.');
}

$domain = rtrim($domain, '.');
if ($domain === '') {
    respondDnsError(400, 'Domain parameter is required (e.g. ?domain=jacobdavis.tech).');
}

// Convert internationalized domain names (IDN) if non-ASCII bytes are present
if (preg_match('/[^\x20-\x7E]/', $domain) === 1) {
    if (!function_exists('idn_to_ascii')) {
        respondDnsError(400, 'Invalid domain syntax. Internationalized domain names require punycode.');
    }
    $asciiDomain = @idn_to_ascii($domain, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);
    if (!is_string($asciiDomain) || $asciiDomain === '') {
        respondDnsError(400, 'Invalid internationalized domain name.');
    }
    $domain = strtolower($asciiDomain);
}

if (strlen($domain) > 253) {
    respondDnsError(400, 'Domain name exceeds maximum RFC length of 253 characters.');
}

// Reject IP literals (IPv4, IPv6, bracketed IPv6, integer/octal/hex IPv4)
if (
    filter_var($domain, FILTER_VALIDATE_IP) !== false
    || preg_match('/^\[.*\]\z/', $domain) === 1
    || ctype_digit($domain)
    || @ip2long($domain) !== false
) {
    respondDnsError(400, 'IP literals are not permitted. Please enter a valid domain name.');
}

// Strict domain validation allowing underscore subdomain labels (_dmarc, _domainkey) and punycode TLDs
if (preg_match('/^(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9](?:[a-z0-9-]{0,57}[a-z0-9])?)\z/i', $domain) !== 1) {
    respondDnsError(400, 'Invalid domain syntax. Please enter a valid fully qualified domain name (e.g. doordash.com or jacobdavis.tech).');
}

// Disallow reserved, local, or private hostnames/TLDs
if (isBlockedHostnameOrTld($domain)) {
    respondDnsError(400, 'Queries for private, reserved, or local hostnames are disallowed.');
}

$parts = explode('.', $domain);

// Query DNS records across major record types
$dnsResults = [
    'a' => [],
    'aaaa' => [],
    'cname' => [],
    'mx' => [],
    'txt' => [],
    'ns' => [],
];

$candidateV4 = [];
$candidateV6 = [];
$allResolvedIps = [];
$cnameTargets = [];

$rawRecords = @dns_get_record($domain, DNS_A | DNS_AAAA | DNS_CNAME | DNS_MX | DNS_TXT | DNS_NS);

if (is_array($rawRecords)) {
    foreach ($rawRecords as $rec) {
        if (!is_array($rec)) {
            continue;
        }
        $type = strtoupper((string) ($rec['type'] ?? ''));
        $ttl = isset($rec['ttl']) && is_numeric($rec['ttl']) ? (int) $rec['ttl'] : 300;

        switch ($type) {
            case 'A':
                if (!empty($rec['ip']) && is_string($rec['ip'])) {
                    $dnsResults['a'][] = [
                        'ip' => $rec['ip'],
                        'ttl' => $ttl,
                    ];
                    $candidateV4[] = $rec['ip'];
                    $allResolvedIps[] = $rec['ip'];
                }
                break;
            case 'AAAA':
                if (!empty($rec['ipv6']) && is_string($rec['ipv6'])) {
                    $dnsResults['aaaa'][] = [
                        'ipv6' => $rec['ipv6'],
                        'ttl' => $ttl,
                    ];
                    $candidateV6[] = $rec['ipv6'];
                    $allResolvedIps[] = $rec['ipv6'];
                }
                break;
            case 'CNAME':
                if (!empty($rec['target']) && is_string($rec['target'])) {
                    $dnsResults['cname'][] = [
                        'target' => $rec['target'],
                        'ttl' => $ttl,
                    ];
                    $cleanTarget = rtrim(strtolower(trim($rec['target'])), '.');
                    if ($cleanTarget !== '') {
                        $cnameTargets[] = $cleanTarget;
                    }
                }
                break;
            case 'MX':
                if (!empty($rec['target']) && is_string($rec['target'])) {
                    $dnsResults['mx'][] = [
                        'target' => $rec['target'],
                        'pri' => isset($rec['pri']) && is_numeric($rec['pri']) ? (int) $rec['pri'] : 10,
                        'ttl' => $ttl,
                    ];
                }
                break;
            case 'TXT':
                $txtVal = '';
                if (!empty($rec['entries']) && is_array($rec['entries'])) {
                    $txtVal = implode('', array_map('strval', $rec['entries']));
                } elseif (isset($rec['txt']) && is_string($rec['txt'])) {
                    $txtVal = $rec['txt'];
                }
                if ($txtVal !== '') {
                    $dnsResults['txt'][] = [
                        'txt' => $txtVal,
                        'ttl' => $ttl,
                    ];
                }
                break;
            case 'NS':
                if (!empty($rec['target']) && is_string($rec['target'])) {
                    $dnsResults['ns'][] = [
                        'target' => $rec['target'],
                        'ttl' => $ttl,
                    ];
                }
                break;
        }
    }
}

// Always check gethostbynamel for SSRF inspection and populate A fallback if A & CNAME are empty
$fallbackIps = @gethostbynamel($domain);
if (is_array($fallbackIps)) {
    foreach ($fallbackIps as $ip) {
        if (!is_string($ip) || $ip === '') {
            continue;
        }
        $allResolvedIps[] = $ip;
        $candidateV4[] = $ip;
        if (empty($dnsResults['a']) && empty($dnsResults['cname'])) {
            $dnsResults['a'][] = [
                'ip' => $ip,
                'ttl' => 300,
            ];
        }
    }
    // Deduplicate A records if populated from fallback
    if (!empty($dnsResults['a'])) {
        $seenA = [];
        $uniqueA = [];
        foreach ($dnsResults['a'] as $aRec) {
            if (!isset($seenA[$aRec['ip']])) {
                $seenA[$aRec['ip']] = true;
                $uniqueA[] = $aRec;
            }
        }
        $dnsResults['a'] = $uniqueA;
    }
}

// Resolve CNAME chain (up to 3 hops) for SSRF verification and TLS candidate IP collection
$visitedCnames = [$domain => true];
$cnameQueue = array_values(array_unique($cnameTargets));
$hop = 0;

while (!empty($cnameQueue) && $hop < 3) {
    $hop++;
    $nextQueue = [];

    foreach ($cnameQueue as $cnameTarget) {
        if (isset($visitedCnames[$cnameTarget])) {
            continue;
        }
        $visitedCnames[$cnameTarget] = true;

        if (filter_var($cnameTarget, FILTER_VALIDATE_IP) !== false) {
            if (!isPublicIp($cnameTarget)) {
                respondDnsError(400, 'Resolved IP address is in a private, loopback, or reserved range.');
            }
            $allResolvedIps[] = $cnameTarget;
            continue;
        }

        if (isBlockedHostnameOrTld($cnameTarget)) {
            respondDnsError(400, 'Queries resolving to private, reserved, or local hostnames are disallowed.');
        }

        $cnameRecords = @dns_get_record($cnameTarget, DNS_A | DNS_AAAA | DNS_CNAME);
        if (is_array($cnameRecords)) {
            foreach ($cnameRecords as $crec) {
                if (!is_array($crec)) {
                    continue;
                }
                $ctype = strtoupper((string) ($crec['type'] ?? ''));
                if ($ctype === 'A' && !empty($crec['ip']) && is_string($crec['ip'])) {
                    $allResolvedIps[] = $crec['ip'];
                    $candidateV4[] = $crec['ip'];
                } elseif ($ctype === 'AAAA' && !empty($crec['ipv6']) && is_string($crec['ipv6'])) {
                    $allResolvedIps[] = $crec['ipv6'];
                    $candidateV6[] = $crec['ipv6'];
                } elseif ($ctype === 'CNAME' && !empty($crec['target']) && is_string($crec['target'])) {
                    $nextTarget = rtrim(strtolower(trim($crec['target'])), '.');
                    if ($nextTarget !== '' && !isset($visitedCnames[$nextTarget])) {
                        $nextQueue[] = $nextTarget;
                    }
                }
            }
        }

        $cnameHostIps = @gethostbynamel($cnameTarget);
        if (is_array($cnameHostIps)) {
            foreach ($cnameHostIps as $cip) {
                if (is_string($cip) && $cip !== '') {
                    $allResolvedIps[] = $cip;
                    $candidateV4[] = $cip;
                }
            }
        }
    }

    $cnameQueue = array_values(array_unique($nextQueue));
}

$allResolvedIps = array_values(array_unique($allResolvedIps));
$candidateV4 = array_values(array_unique($candidateV4));
$candidateV6 = array_values(array_unique($candidateV6));

// Strict Pre-Socket SSRF Block: EVERY resolved IP must be globally routable public IP
foreach ($allResolvedIps as $resolvedIp) {
    if (!isPublicIp($resolvedIp)) {
        respondDnsError(400, 'Resolved IP address is in a private, loopback, or reserved range.');
    }
}

// Track whether NS records exist directly on the queried domain before parent inheritance
$hasDirectNs = !empty($dnsResults['ns']);

// Authoritative parent-walk NS fallback (respecting multi-part ccTLD public suffixes)
if (!$hasDirectNs && count($parts) > 2) {
    $multiPartSuffixes = [
        'co.uk', 'org.uk', 'me.uk', 'net.uk', 'ltd.uk', 'plc.uk', 'ac.uk',
        'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
        'co.jp', 'or.jp', 'ne.jp', 'ac.jp', 'go.jp',
        'co.nz', 'org.nz', 'net.nz',
        'co.za', 'org.za',
        'com.br', 'org.br', 'net.br',
        'com.mx',
        'com.in', 'co.in', 'net.in', 'org.in',
        'com.cn', 'net.cn', 'org.cn',
        'com.tw', 'com.hk', 'com.sg', 'co.kr', 'com.tr', 'com.ar', 'co.id', 'co.th', 'co.il',
    ];

    $walkParts = $parts;
    while (count($walkParts) > 2) {
        array_shift($walkParts);
        if (count($walkParts) < 2) {
            break;
        }
        $candidateParent = implode('.', $walkParts);
        if (count($walkParts) === 2 && in_array($candidateParent, $multiPartSuffixes, true)) {
            break;
        }

        $parentNs = @dns_get_record($candidateParent, DNS_NS);
        if (is_array($parentNs) && !empty($parentNs)) {
            foreach ($parentNs as $rec) {
                if (!empty($rec['target']) && is_string($rec['target'])) {
                    $dnsResults['ns'][] = [
                        'target' => $rec['target'],
                        'ttl' => isset($rec['ttl']) && is_numeric($rec['ttl']) ? (int) $rec['ttl'] : 300,
                        'inherited_from' => $candidateParent,
                    ];
                }
            }
            if (!empty($dnsResults['ns'])) {
                break;
            }
        }
    }
}

// Anti-TOCTOU Direct-IP SSL Certificate Handshake & Inspector
$sslInfo = [
    'status' => 'NONE',
    'issuer' => 'None / Not Responding on Port 443',
    'subject' => null,
    'valid_from' => null,
    'valid_to' => null,
    'days_remaining' => null,
    'is_expired' => false,
    'verified' => false,
    'san' => [],
    'san_total' => 0,
];

$tlsTargets = array_slice(array_merge($candidateV4, $candidateV6), 0, 3);

if (empty($tlsTargets)) {
    $sslInfo['issuer'] = 'Skipped (no A/AAAA records)';
} else {
    foreach ($tlsTargets as $targetIp) {
        if (!isPublicIp($targetIp)) {
            continue;
        }

        $isV6 = str_contains($targetIp, ':');
        $endpoint = $isV6 ? "ssl://[{$targetIp}]:443" : "ssl://{$targetIp}:443";

        $verifiedCtx = stream_context_create([
            'ssl' => [
                'capture_peer_cert' => true,
                'verify_peer' => true,
                'verify_peer_name' => true,
                'SNI_enabled' => true,
                'peer_name' => $domain,
            ],
        ]);

        $errno = 0;
        $errstr = '';
        $socket = @stream_socket_client(
            $endpoint,
            $errno,
            $errstr,
            2.5,
            STREAM_CLIENT_CONNECT,
            $verifiedCtx
        );

        $verified = ($socket !== false);

        // If TLS chain/name verification failed during handshake (errno === 0), probe once unverified solely to read cert metadata
        if ($socket === false && $errno === 0) {
            $unverifiedCtx = stream_context_create([
                'ssl' => [
                    'capture_peer_cert' => true,
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'SNI_enabled' => true,
                    'peer_name' => $domain,
                ],
            ]);
            $socket = @stream_socket_client(
                $endpoint,
                $errno,
                $errstr,
                2.5,
                STREAM_CLIENT_CONNECT,
                $unverifiedCtx
            );
        }

        if ($socket !== false) {
            $params = stream_context_get_params($socket);
            @fclose($socket);

            if (!empty($params['options']['ssl']['peer_certificate'])) {
                $cert = @openssl_x509_parse($params['options']['ssl']['peer_certificate']);
                if (is_array($cert)) {
                    $validTo = isset($cert['validTo_time_t']) && is_numeric($cert['validTo_time_t']) ? (int) $cert['validTo_time_t'] : 0;
                    $validFrom = isset($cert['validFrom_time_t']) && is_numeric($cert['validFrom_time_t']) ? (int) $cert['validFrom_time_t'] : 0;
                    $issuerOrg = $cert['issuer']['O'] ?? $cert['issuer']['CN'] ?? 'Unknown Authority';
                    $subjectCN = $cert['subject']['CN'] ?? $domain;
                    $daysLeft = (int) round(($validTo - time()) / 86400);

                    $sans = [];
                    if (!empty($cert['extensions']['subjectAltName']) && is_string($cert['extensions']['subjectAltName'])) {
                        $rawSans = explode(',', $cert['extensions']['subjectAltName']);
                        foreach ($rawSans as $s) {
                            $s = trim(str_replace('DNS:', '', $s));
                            if ($s !== '' && !in_array($s, $sans, true)) {
                                $sans[] = $s;
                            }
                        }
                    }

                    $isExpired = ($validTo <= time());

                    $sslInfo = [
                        'status' => $isExpired ? 'EXPIRED' : ($verified ? 'ACTIVE' : 'UNTRUSTED'),
                        'issuer' => is_string($issuerOrg) ? $issuerOrg : 'Unknown Authority',
                        'subject' => is_string($subjectCN) ? $subjectCN : $domain,
                        'valid_from' => $validFrom > 0 ? date('Y-m-d', $validFrom) : null,
                        'valid_to' => $validTo > 0 ? date('Y-m-d', $validTo) : null,
                        'days_remaining' => $daysLeft,
                        'is_expired' => $isExpired,
                        'verified' => $verified,
                        'san' => array_slice($sans, 0, 10),
                        'san_total' => count($sans),
                    ];
                    break;
                }
            }
        }
    }
}

$queryTimeMs = round((microtime(true) - $startTime) * 1000, 1);
$hasRecords = !empty($dnsResults['a'])
    || !empty($dnsResults['aaaa'])
    || !empty($dnsResults['cname'])
    || !empty($dnsResults['mx'])
    || !empty($dnsResults['txt'])
    || $hasDirectNs;

$resolverLabel = 'Server Recursive DNS Resolver (dns_get_record)';

respondDnsJson(200, [
    'status' => 'success',
    'domain' => $domain,
    'query_time_ms' => $queryTimeMs,
    'has_records' => $hasRecords,
    'records' => $dnsResults,
    'dns' => $dnsResults,
    'ssl' => $sslInfo,
    'resolver' => $resolverLabel,
    'server_resolver' => $resolverLabel,
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
]);

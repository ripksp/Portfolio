<?php
/**
 * Sanitized configuration template for api/chat.php.
 * Copy this file to api/config.php on the Bluehost server (never commit api/config.php).
 */

if (!defined('ALLOWED_ACCESS')) {
    http_response_code(403);
    exit('Direct access forbidden.');
}

return [
    'gemini_api_key' => getenv('GEMINI_API_KEY') ?: 'your_gemini_api_key_here',
    'model' => 'gemini-flash-latest'
];

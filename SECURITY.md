# Security Documentation

This document outlines the security measures implemented in the realpomo website.

## Security Headers

The website includes the following security headers via meta tags:

- **Content-Security-Policy (CSP)**: Restricts resource loading to prevent XSS attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **Referrer-Policy**: Controls referrer information leakage

### Recommended Server-Side Headers

For production deployment, configure your web server to send these headers:

```apache
# Apache .htaccess
Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
```

```nginx
# Nginx configuration
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## Input Validation & Sanitization

### JavaScript Input Validation

1. **URL Validation**: All external URLs are validated to ensure they point to allowed domains (github.com)
2. **String Sanitization**: User-facing strings are sanitized using DOM textContent to prevent XSS
3. **Numeric Validation**: All numeric inputs are clamped to valid ranges
4. **API Response Validation**: GitHub API responses are validated before use

### localStorage Security

- Cache data is validated before use
- Invalid or corrupted cache is automatically cleared
- Cache keys are namespaced to prevent conflicts
- Cache expiration is enforced

## External Link Security

All external links include:
- `rel="noopener noreferrer"` to prevent tabnabbing and referrer leakage
- URL validation before setting href attributes
- Domain whitelist validation (only github.com allowed)

## API Security

### GitHub API Integration

- **Rate Limiting**: Implements retry logic with exponential backoff
- **Timeout Protection**: 10-second timeout on API requests
- **Response Validation**: Validates response structure before use
- **Error Handling**: Graceful degradation on API failures
- **Caching**: Reduces API calls with 5-minute cache

### Asset URL Validation

- All asset URLs are validated to ensure they're from github.com
- Protocol validation (HTTPS only)
- Hostname validation

## Audio File Security

- Audio files are loaded from same-origin only
- Path traversal protection (prevents `../` attacks)
- File size limits (max 1MB) to prevent memory exhaustion
- Fallback to synthesized sounds if file loading fails

## Notification Security

- Notifications only use same-origin icons
- Permission requests are user-initiated
- Error handling prevents permission request failures from breaking the app

## Content Security Policy Details

The CSP allows:
- Scripts: Same-origin + inline (required for timer functionality)
- Styles: Same-origin + inline (required for dynamic styling)
- Images: Same-origin, data URIs, and HTTPS
- Fonts: Same-origin and data URIs
- Connections: Same-origin and GitHub API (api.github.com)
- Frames: None (prevents embedding)

## Best Practices Implemented

1. **Defense in Depth**: Multiple layers of validation
2. **Fail Secure**: Defaults to safe states on errors
3. **Least Privilege**: Minimal permissions requested
4. **Input Validation**: All inputs validated and sanitized
5. **Output Encoding**: User-facing content is properly escaped
6. **Error Handling**: Errors don't expose sensitive information
7. **Logging**: Security-relevant errors are logged appropriately

## Security Audit Checklist

- [x] Content Security Policy implemented
- [x] XSS protection (input sanitization)
- [x] CSRF protection (same-origin API calls only)
- [x] Clickjacking protection (X-Frame-Options)
- [x] MIME type sniffing protection
- [x] Secure external links (noopener, noreferrer)
- [x] Input validation and sanitization
- [x] Secure localStorage usage
- [x] API response validation
- [x] Error handling without information leakage
- [x] HTTPS enforcement (via CSP)
- [x] Path traversal protection
- [x] File size limits
- [x] Rate limiting on API calls

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com (replace with your contact) rather than opening a public issue.


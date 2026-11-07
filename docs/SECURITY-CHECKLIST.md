# Security checklist

## Implemented and checked
- [x] Server validates every application independently of client checks.
- [x] Request size capped; unknown fields rejected.
- [x] SQL parameters bound; table relationships and uniqueness enforced in SQLite.
- [x] API text inserted through textContent, never interpolated as HTML.
- [x] Helmet headers; restrictive same-origin CSP without inline scripts/styles; frame ancestors blocked.
- [x] General API limit: 120 requests/IP/minute. Application endpoint: 5 requests/IP/minute (failed attempts count).
- [x] 429 responses include retry information; proxy trust is not enabled.
- [x] Writes require JSON and a custom header; cross-origin submissions rejected; no CORS permission granted.
- [x] No cookie/session authority; no public applicant-reading endpoint.
- [x] Public internship mutations blocked, application responses omit personal fields.
- [x] Runtime database excluded from Git; error handler does not return stack traces or SQL internals.
- [x] Duplicate constraint protects against double-clicks and uncertain network retries.

## Deployment limitations
This is a local educational demonstration, not a production recruiting service. Use fictional data. SQLite files are not encrypted at rest. There is no identity verification: someone can submit another person's email, and duplicate feedback can reveal that an email/role pair exists. Before accepting real applications, add verified identity, authorization, a privacy/retention process, storage access controls and monitoring.

Serve HTTPS in production, enable HSTS and CSP upgrade-insecure-requests there (disabled here for local HTTP). Configure the exact public origin and trusted proxy chain. In-memory rate limits reset with the process and are per-instance; use a shared limiter store for multiple instances. Apply a deployment-level body/connection limit. Do not expose the database or create unauthenticated admin endpoints.

References: https://helmetjs.github.io/ and https://github.com/express-rate-limit/express-rate-limit

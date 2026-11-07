# Test report

Date: 8 November 2026. Environment: Windows, Node.js 22.20.0. Command: npm test.

Result: **11 test-runner entries passed, 0 failed** (including the parent integration test). See test-output.txt for the captured output.

## Automated checks
- Frontend loading feedback; rejected request shows failure; retry renders cards.
- API strings rendered as text, including HTML-like input; empty results feedback.
- Form values preserved after network failure; retry succeeds and disables repeated submission.
- Static frontend, paginated API data and security headers.
- Independent server rejection of malformed fields, nulls, arrays, missing consent, unknown fields and unavailable roles.
- Cross-origin, missing custom header and incorrect content type rejection.
- Invalid JSON and oversized body errors.
- Successful application, email normalization, duplicate rejection and persisted data visible through a second database connection.
- SQL-like name stored literally; tables remain intact.
- Applicant retrieval unavailable and internship mutations rejected.
- Application and general API rate limits, 429 and Retry-After.

## Browser verification
- Loaded the integrated frontend at http://127.0.0.1:3002 and confirmed API-fed listings.
- Opened application dialog and submitted fictional Demo Student / browser-check@example.test data; success reference #1 was displayed.
- Checked 390px mobile layout: no horizontal page overflow. Screenshots included.

## Boundaries
DOM tests simulate fetch responses to exercise network failure/retry; they are not a browser-engine accessibility audit. HTTP tests use a real local server and isolated SQLite files. No penetration test or public deployment review was performed. Dependency audit reported zero known vulnerabilities at implementation time; rerun it as dependencies evolve.

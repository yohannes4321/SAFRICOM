# Verification results

Verified on 9 October 2026.

| Check | Result |
|---|---|
| Spring Boot integration tests (Docker build, `mvn verify`) | 5 passed; 0 failures/errors/skipped |
| React interaction tests (`npm test`, Vitest 5.0.3) | 3 passed |
| Frontend production build (`npm run build`, Vite 8.3.4) | Passed |
| npm dependency audit after tooling update | 0 vulnerabilities reported |
| Multi-stage backend Docker image build | Passed |
| Docker Compose configuration and startup | Passed |
| Live API smoke test (`python3 scripts/smoke_test.py`) | Passed against localhost:8080 |
| Frontend development server HTTP response | 200 at localhost:5173 |

Backend tests exercise the real Spring application, H2 persistence, DTO validation, title/description boundaries, default and preserved statuses, invalid enum values, malformed JSON/IDs, missing-task responses, and CORS preflight.

React tests exercise create/edit/delete interactions, cancelled delete confirmation, whitespace-title validation, connection-error feedback, and retry. HTTP is mocked in these component tests; no browser-driven end-to-end test was performed.

The separate live HTTP smoke test verifies the running Docker container: list/create/read/update/delete, persisted updates, default TODO, the Location header, invalid fields/status/IDs, CORS, and 404s after deletion. It removes its test task.

H2 data is intentionally temporary and is lost when the backend restarts.

# Safaricom Ethiopia — Task Manager

Full-stack assessment solution: React, Java 17 / Spring Boot, Spring Data JPA, H2, and a Dockerized API.

## Run

Prerequisites: Docker with Compose, and Node.js 22.12+ with npm. Java and Maven are only needed if running the backend without Docker.

From the repository root:

```sh
docker compose up --build -d
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. API: **http://localhost:8080/api/tasks**.

```sh
curl -i http://localhost:8080/api/tasks
```

The first Docker build downloads Maven dependencies and runs the backend tests. To stop the backend, run `docker compose down` from the root. H2 is in memory: tasks reset when the API restarts.

Without Docker (Java 17+, Maven 3.6.3+):

```sh
cd backend
mvn spring-boot:run
```

## Tests and build

```sh
# Backend tests; also executed during docker build
cd backend
mvn verify

# Frontend component/integration tests and production build
cd ../frontend
npm ci
npm test
npm run build

# Real HTTP CRUD/validation/CORS smoke test against the running container
cd ..
python3 scripts/smoke_test.py
```

## REST API

| Method | Endpoint | Success | Errors |
|---|---|---|---|
| GET | /api/tasks | 200, JSON array (newest first) | — |
| GET | /api/tasks/{id} | 200, task | 400 invalid ID; 404 missing |
| POST | /api/tasks | 201, task and Location header | 400 invalid input |
| PUT | /api/tasks/{id} | 200, updated task | 400 invalid input; 404 missing |
| DELETE | /api/tasks/{id} | 204, empty body | 400 invalid ID; 404 missing |

The assessment's missing update-method label is interpreted as PUT.

```sh
curl -i -X POST http://localhost:8080/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Prepare report","description":"Draft weekly report","status":"TODO"}'
```

Titles are trimmed and must contain 3–100 characters, with at least one non-whitespace character. Description is optional, maximum 500 characters. Status accepts only `TODO`, `IN_PROGRESS`, or `DONE` (case sensitive); numeric enum values are rejected. Missing/null status defaults to TODO on creation and preserves the existing status on update. PUT requires title; omitted description is cleared.

Validation, malformed JSON, invalid IDs/statuses, and missing-task errors use `{ "message": "...", "status": 400 }` (or 404).

## Structure and configuration

- `backend/`: controller → transactional service → JPA repository, request/response DTOs, centralized error handling, and integration tests.
- `frontend/`: responsive React CRUD screen, fetch API wrapper, validation, feedback, and interaction tests.
- `backend/Dockerfile`: multi-stage Maven build and non-root Java 17 runtime.
- `compose.yaml`: backend on host port 8080.
- `scripts/smoke_test.py`: dependency-free live API test; creates and removes its own task.

CORS permits `http://localhost:5173`. Override with backend environment variable `CORS_ALLOWED_ORIGIN`. Copy `frontend/.env.example` to `frontend/.env` to change `VITE_API_URL`; restart Vite after changing it. Vite uses port 5173 with strict-port enforcement so CORS stays predictable.

No authentication, cloud deployment, or durable storage is included, as specified in the assessment. The browser tests mock HTTP; the Python smoke test separately verifies real container HTTP behavior.

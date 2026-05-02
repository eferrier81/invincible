# Invincible Game

Full-stack turn-based boss battle game project.

## Stack

- Frontend: Angular
- Backend: Spring Boot (Java 21)
- Database: MySQL 8
- Deployment: Docker + Docker Compose

## Project Structure

- `src/frontend`: Angular SPA
- `src/backend`: Spring Boot API
- `docs`: architecture, deployment, API contracts
- `tests`: e2e and integration test placeholders
- `.github/workflows`: CI/CD pipelines

## Quick Start (local with Docker)

1. Copy `.env.example` to `.env`.
2. Fill secrets in `.env`.
3. Run:
   - PowerShell: `./scripts/local-up.ps1`
   - or `docker compose up --build`

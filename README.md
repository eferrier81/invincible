# Invincible Game

Full-stack turn-based boss battle web application developed for **977-364 Software Deployment and Maintenance** at Prince of Songkla University, Phuket Campus.[file:37]

## Project Overview

Invincible Game is a web-based application where players collect character cards, build teams, and fight bosses in turn-based battles. The project is designed as a complete full-stack system with a responsive frontend, a RESTful backend, persistent storage, containerized deployment, and maintenance-oriented development practices.[file:37]

The application follows the course objective of building, deploying, and maintaining a real-world web application using Docker, cloud deployment concepts, CI/CD automation, configuration management, semantic versioning, and structured software maintenance workflows.[file:37]

## Main Goals

- Provide user authentication and role-based access control.[file:37]
- Deliver at least four distinct CRUD features through a responsive web interface and REST API.[file:37]
- Containerize the application with Docker and orchestrate services with Docker Compose.[file:37]
- Support cloud deployment through environment-based configuration.[file:37]
- Apply structured Git workflows, pull requests, release management, and changelog tracking.[file:37]
- Demonstrate maintenance activities such as issue tracking, change requests, bug fixing, and post-release improvements.[file:37]

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Angular |
| Backend | Spring Boot (Java 21) |
| Database | MySQL 8 |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Version Control | Git + GitHub |

The selected stack follows the course-recommended technologies, which explicitly include Angular, Spring Boot, MySQL, Docker, Docker Compose, and GitHub Actions-compatible CI/CD workflows.[file:37]

## Core Features

Current and planned application features include:

- User registration and login with secure authentication.
- Character card collection management.
- Deck / team creation and management.
- Boss list and boss detail views.
- Turn-based boss battle system.
- Reward flow after battle completion.
- Admin management for cards, bosses, and reward pools.
- Battle history and maintenance-driven feature evolution.

These features support the course requirement for a user-facing application with backend persistence, authentication, multiple CRUD domains, and a RESTful API backend.[file:37]

## Project Structure

The repository is organized to align with the recommended course structure.[file:37]

```text
project-root/
├── src/
│ ├── frontend/ # Angular SPA
│ └── backend/ # Spring Boot API
├── tests/ # Integration / E2E test placeholders
├── docs/ # Project documentation
│ ├── architecture.md
│ ├── deployment-guide.md
│ ├── change-requests/
│ └── progress-logs/
├── scripts/ # Local helper scripts
├── .github/workflows/ # CI/CD pipeline configuration
├── Dockerfile # Docker configuration (if root-level backend build is used)
├── docker-compose.yml # Multi-service local deployment
├── CHANGELOG.md # Version history
└── README.md # Project overview and setup guide

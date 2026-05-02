# Deployment Guide

## Local deployment

1. Copy `.env.example` to `.env`.
2. Set all secret values.
3. Run `docker compose up --build`.

## CI/CD

- CI runs on pull requests to `develop`.
- CD runs on push to `main`.

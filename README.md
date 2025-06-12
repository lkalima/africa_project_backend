# Africa Project - Backend

This repository contains the source code for the backend of the "Africa Project" (working title). It is a [Payload CMS](https://payloadcms.com/) application that serves as a Headless CMS, providing a powerful admin panel for content management and a robust REST/GraphQL API for the frontend.

## Project Vision

The "Africa Project" aims to be a comprehensive, community-driven digital archive and encyclopedia dedicated to the preservation, celebration, and exploration of the cultures, histories, and peoples of the African continent. This backend is the foundational content hub for that vision. For more details, see the full [Project Blueprint](./DOCUMENTATION.md).

## Core Technologies

*   **Framework**: [Payload CMS](https://payloadcms.com/)
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/)

## Local Development Setup

Follow these steps to get the backend running on your local machine.

### Prerequisites

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/) (LTS version, `nvm` recommended)
*   [PostgreSQL](https://www.postgresql.org/) running locally

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YourUsername/african-voices-backend.git
    cd african-voices-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    *   Create a new file named `.env` in the root of the project by making a copy of `.env.example`.
    *   Update the `DATABASE_URI` with your local PostgreSQL connection details.
    ```env
    PAYLOAD_SECRET=YOUR_COMPLEX_SECRET_KEY
    DATABASE_URI=postgresql://postgres:YOUR_PASSWORD@localhost:5432/africa_project_payload
    ```
    *   Update the `PAYLOAD_SECRET` with a long, random string.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

The admin panel will now be accessible at `http://localhost:3000/admin`.

## API Documentation

This project uses `@payloadcms/plugin-openapi` to automatically generate interactive API documentation. Once the development server is running, you can access the Swagger UI at:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Seeding Data

The `/scripts` directory contains Node.js scripts for seeding the database from `.csv` files located in the `/data` directory. To run a script, ensure the server is running in one terminal, then in a second terminal, run:

```bash
# Example for seeding geographies
node scripts/seed-geographies.js
```
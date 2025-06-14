# Africa Project - Backend

This repository contains the source code for the backend of the "Africa Project" (working title). It is a [Payload CMS](https://payloadcms.com/) application that serves as a Headless CMS, providing a powerful admin panel for content management and a robust REST/GraphQL API for the frontend.

## Project Vision

The "Africa Project" aims to be a comprehensive, community-driven digital archive and encyclopedia dedicated to the preservation, celebration, and exploration of the cultures, histories, and peoples of the African continent. This backend is the foundational content hub for that vision. For more details, see the full [Project Blueprint](https://imiak1910.onlyoffice.com/s/jnJbN52qTTc_P5r).

## Core Technologies

*   **Framework**: [Payload CMS](https://payloadcms.com/)
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/)

## 📁 Project Structure

This Payload CMS project follows a structured layout. Here is an overview of the key files and directories:

*   **/src/**: The primary source code directory for the application.
    *   **/src/collections/**: This is the heart of the CMS. Each `.ts` file defines a data model (e.g., `MusicalInstruments.ts`, `EthnicGroups.ts`). These files control the admin UI and API structure.
    *   **/src/payload.config.ts**: The main configuration file for Payload. This is where collections are registered, plugins are added, and core settings are defined.
*   **/data/**: Contains the `.csv` source files used for populating the database. This directory is tracked by Git to maintain a record of the raw seed data.
*   **/scripts/**: Holds the Node.js scripts used to seed the database. These scripts read from the `/data` directory and write to the API.
*   **/uploads/**: (Ignored by Git) When you upload media through the admin panel in your local environment, the files are stored here.
*   **.env**: (Ignored by Git) **CRITICAL:** This file holds all secret keys and environment variables, such as your database connection string and Payload secret. It should never be committed to Git.
*   **payload-types.ts**: (Ignored by Git) An auto-generated TypeScript file that contains all the types for your collections. This provides type safety across the project.

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
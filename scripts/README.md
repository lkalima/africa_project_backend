# Scripts

This directory contains utility and maintenance scripts for the project, primarily for seeding the database from CSV files.

## Usage

These scripts are designed to be run from the command line from the root of the project.

**Important:** The main Payload server (`npm run dev`) must be running in a separate terminal for these scripts to successfully connect to the API.

### Example: Seeding Geographies
1. Ensure the server is running.
2. Run the script: `node scripts/seed-geographies.js`
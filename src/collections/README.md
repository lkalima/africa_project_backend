# Collections

This directory contains the data model definitions for the Payload CMS. Each `.ts` file in this folder defines a "collection" (similar to a database table or a content type).

These definitions control:
- The fields available in the Admin Panel.
- The shape of the data in the API.
- The access control rules (who can read, create, update, or delete data).

All collections must be registered in `src/payload.config.ts` to be active.
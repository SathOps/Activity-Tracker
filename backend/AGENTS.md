# Backend Agent Instructions

## Context
You are an expert backend engineer assisting with a server-side application. Your primary focus is on writing secure, efficient, and well-structured API logic and database operations.

## Tech Stack
* **Language:** Python (managed via `uv`)
* **Framework:** FastAPI
* **Database:** SQLite (configured via the `SQLITE_DB_PATH` environment variable)
* **ORM:** SQLAlchemy 2.0+ (using type-annotated declarative models with `Mapped` and `mapped_column`)

## Coding Standards & Preferences
* **Architecture:** Follow RESTful API design principles. Keep route handlers clean by moving complex business logic into dedicated service layers or helper functions.
* **Database Interactions:** Use SQLAlchemy 2.0 query style (e.g., `db.scalars(select(Model).where(...))`) and access database sessions using standard context managers (`with get_db_session() as session:`) or FastAPI dependencies (`Depends(get_db)`).
* **Database Migrations:** Schema updates are run programmatically on startup in `init_db()` using custom helper checks (e.g., `_add_column_if_missing`). Avoid using raw SQL scripts.
* **User Preferences:** Since the database is SQLite, avoid PostgreSQL-specific types like `JSONB`. Store configuration/settings in dedicated columns or JSON-serialized strings.
* **Type Hinting:** Use Python type hints extensively for function arguments and return types to improve readability and catch errors early.
* **Naming Conventions:** Use snake_case for Python variables, functions, and file names. Use PascalCase for Classes. 

## Error Handling & Logging
* Never fail silently. Use standard try/except blocks and return appropriate HTTP status codes (400 for bad input, 404 for not found, 500 for server errors) alongside helpful JSON error messages.
* Do not expose internal server errors or stack traces to the client.

## Security
* Never hardcode secrets, API keys, or database credentials. Always assume they are loaded via environment variables.
* Always validate and sanitize incoming payload data before processing it.
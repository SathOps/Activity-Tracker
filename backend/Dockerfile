# Use official Python slim image
FROM python:3.13-slim

# The uv binary is available as a separate image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set work directory — docker-compose builds with context: ./backend
# so all COPY paths are relative to the backend/ folder
WORKDIR /app

# Copy dependency files first (for layer caching) and install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-cache

# Copy all backend source code
COPY . .

# Set permissions on entrypoint
RUN chmod +x entrypoint.sh

# Expose ports (Streamlit: 8501, FastAPI: 8000)
EXPOSE 8501 8000

# Add the virtual environment's bin to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Run from the backend directory
ENTRYPOINT ["./entrypoint.sh"]

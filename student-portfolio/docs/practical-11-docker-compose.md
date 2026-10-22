# Practical 11: Containerization with Docker and Docker Compose

## Objective

Containerize the React frontend and Express backend, run MongoDB as a service,
and connect all three services with Docker Compose and a persistent database
volume.

## Architecture

```text
Browser :5174 -> Nginx frontend container
                     |
                     +-> API calls to host :5001 -> Express backend container
                                                        |
                                                        +-> MongoDB container
```

The frontend uses `DOCKER_API_BASE` at build time. Its default is
`http://localhost:5001`; the backend container publishes that host port and
maps it to its internal port 5000. Docker uses 5001 and 5174 to avoid conflicts
with the local development server's default ports. MongoDB is available to the
backend using the Compose service name `mongo`, not `localhost`.

## Run the application

Requirements: Docker Engine and the Docker Compose plugin.

1. Copy `.env.example` to `.env`.
2. Set `JWT_SECRET` to a long private random value. Configure the optional
   Google and SMTP variables only if those services are needed.
3. From the project directory, build and start the stack:

   ```sh
   docker compose up --build -d
   ```

4. Check service status and logs:

   ```sh
   docker compose ps
   docker compose logs backend
   ```

5. Open `http://localhost:5174`. The Express API is available at
   `http://localhost:5001`.
6. Stop the containers while keeping MongoDB data:

   ```sh
   docker compose down
   ```

MongoDB stores data in the named `mongo_data` volume. Removing containers with
`docker compose down` preserves it. Do not run `docker compose down -v` unless
you intend to delete the database volume and all its data.

To rebuild the frontend with a different API host, set `DOCKER_API_BASE` in
`.env` and rerun `docker compose up --build -d`.

## Screenshot evidence

- `docker compose ps` showing `mongo`, `backend`, and `frontend` running.
- The application loaded from `http://localhost:5174`.
- Backend logs showing MongoDB connected successfully and the API listening on
  port 5000 inside the container (host port 5001).

Do not include `.env` contents, secrets, or tokens in screenshots.

## Analysis

- Compose provides an isolated network where the backend reaches the database
  by the service name `mongo`.
- The MongoDB health check ensures the database is ready before the backend
  starts.
- The named volume keeps database data when containers are stopped or
  recreated.
- Containers package runtime dependencies consistently, but production
  deployments still need secure secrets, backups, monitoring, and an external
  or managed database strategy.

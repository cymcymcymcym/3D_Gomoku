# Docker Setup for 3D Gomoku

This guide explains how to run the 3D Gomoku application using Docker.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed on your system

## Project Structure

The Docker setup consists of two main services:
- **Backend**: Flask API server with TensorFlow for AI
- **Frontend**: Nginx serving the static React application files

## Quick Start

If you're experiencing issues with Docker Compose, you can run the containers separately:

1. Build and run the backend container:
```bash
docker build -t 3d-gomoku-backend -f Dockerfile.backend .
docker run -d --name backend -p 3002:3002 3d-gomoku-backend
```

2. Build and run the frontend container:
```bash
docker build -t 3d-gomoku-frontend -f Dockerfile.frontend.simple .
docker run -d --name frontend -p 80:80 --link backend:backend 3d-gomoku-frontend
```

3. Access the application in your browser at [http://localhost](http://localhost)

## Docker Compose (Alternative)

If Docker Compose works for you, you can use:

```bash
docker compose up
```

## Troubleshooting

- **"invalid character 'ÿ' looking for beginning of value" error**: There might be an issue with your Docker config file. Try removing it:
  ```
  del "%USERPROFILE%\.docker\config.json"
  ```
  
- **Backend dependency conflicts**: Check requirements.txt for compatible versions. We've fixed a conflict between numpy and tensorflow by using numpy 1.23.5 instead of 1.24.4.

- **Frontend build issues**: If you're having trouble building the frontend with Docker, build it locally first with `npm run build` and then use the simplified frontend Dockerfile.

- **Frontend can't connect to backend**: The application has been updated to use Nginx for proxying API requests. All API calls now go through the same domain/port as the frontend (port 80), which eliminates cross-origin issues.

## Notes

- The AI model weights are included in the backend container
- Nginx is configured to proxy API requests to the backend service
- The TensorFlow environment is set to use CPU only
- For troubleshooting, you can check container logs with `docker logs backend` or `docker logs frontend` 
# 🚀 Social Platform Backend

> A modern, scalable microservices-based social platform built with TypeScript, Express.js, and PostgreSQL

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

## 📋 Table of Contents

- [🚀 Social Platform Backend](#-social-platform-backend)
  - [📋 Table of Contents](#-table-of-contents)
  - [🎯 Overview](#-overview)
  - [🏗️ Architecture](#️-architecture)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [📁 Project Structure](#-project-structure)
  - [🚀 Quick Start](#-quick-start)
  - [📦 Installation](#-installation)
  - [🔧 Configuration](#-configuration)
  - [🐳 Docker Setup](#-docker-setup)
  - [🏃‍♂️ Running the Application](#️-running-the-application)
  - [📖 API Documentation](#-api-documentation)
  - [🧪 Testing](#-testing)
  - [🚢 Deployment](#-deployment)
  - [🤝 Contributing](#-contributing)
  - [📝 License](#-license)
  - [🆘 Support](#-support)

## 🎯 Overview

A comprehensive social platform backend featuring a microservices architecture that supports user management, posts, comments, real-time chat, media handling, notifications, analytics, and search functionality.

### ✨ Key Features

- 🔐 **Authentication & Authorization** - JWT-based auth with refresh tokens
- 👥 **User Management** - Profile management, follow/unfollow system
- 📝 **Posts & Comments** - Create, edit, delete posts with nested comments
- 💬 **Real-time Chat** - WebSocket-based messaging system
- 📁 **Media Handling** - File upload and processing with multiple format support
- 🔔 **Notifications** - Real-time push notifications and email alerts
- 📊 **Analytics** - User behavior tracking and insights
- 🔍 **Search** - Full-text search across posts and users
- 🏗️ **Microservices Architecture** - Independently deployable services
- 🐳 **Containerized** - Docker support for easy deployment

## 🏗️ Architecture

The backend follows a microservices architecture with an API gateway routing requests to individual services. Each service is independently deployable and communicates through well-defined APIs. The frontend connects to the API gateway, which handles routing, authentication, and load balancing.

### 🏛️ Microservices

| Service | Port | Responsibility | Database |
|---------|------|----------------|----------|
| **User Service** | 3001 | Authentication, user profiles, follows | PostgreSQL |
| **Post Service** | 3002 | Posts, likes, shares | PostgreSQL |
| **Comment Service** | 3003 | Comments, replies, comment likes | PostgreSQL |
| **Chat Service** | 3004 | Real-time messaging, chat rooms | PostgreSQL |
| **Media Service** | 3005 | File upload, image processing | PostgreSQL |
| **Notification Service** | 3006 | Push notifications, email alerts | PostgreSQL |
| **Analytics Service** | 3007 | User behavior, metrics | PostgreSQL |
| **Search Service** | 3008 | Full-text search, recommendations | Elasticsearch |

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.0+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL 15
- **ORM**: Drizzle ORM
- **Cache**: Redis 7
- **Search**: Elasticsearch 8.11
- **Real-time**: Socket.io
- **Authentication**: JWT + Refresh Tokens
- **Validation**: Zod
- **File Upload**: Multer + Sharp

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Process Manager**: PM2
- **Monitoring**: Prometheus + Grafana
- **Load Balancer**: Nginx
- **CI/CD**: GitHub Actions
- **Deployment**: Kubernetes

### Development
- **Package Manager**: Bun
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier
- **Documentation**: OpenAPI/Swagger
- **Git Hooks**: Husky

## 📁 Project Structure
social-platform-backend/
├── 📁 services/ # Microservices
│ ├── 📁 user-service/ # User management & auth
│ ├── 📁 post-service/ # Posts & likes
│ ├── 📁 comment-service/ # Comments & replies
│ ├── 📁 chat-service/ # Real-time messaging
│ ├── 📁 media-service/ # File handling
│ ├── 📁 notification-service/ # Notifications
│ ├── 📁 analytics-service/ # Analytics & metrics
│ └── 📁 search-service/ # Search & recommendations
├── 📁 shared/ # Shared utilities
│ ├── 📁 types/ # TypeScript definitions
│ ├── 📁 utils/ # Common utilities
│ ├── 📁 middleware/ # Shared middleware
│ └── 📁 database/ # Database utilities
├── 📁 infrastructure/ # Infrastructure configs
│ ├── 📁 docker/ # Docker configurations
│ ├── 📁 kubernetes/ # K8s manifests
│ └── 📁 monitoring/ # Monitoring configs
├── 📁 scripts/ # Build & deployment scripts
├── 📄 docker-compose.yml # Development environment
├── 📄 package.json # Root package configuration
└── 📄 README.md # This file

## 🚀 Quick Start

Clone the repository

git clone https://github.com/yourusername/social-platform-backend.git

cd social-platform-backend

Run the quick setup script

./scripts/quick-start.sh

Or manual setup:
1. Install dependencies

bun install
./scripts/install-all.sh

2. Start infrastructure

docker-compose up -d

3. Setup environment variables

cp services/user-service/.env.example services/user-service/.env

Edit .env files for each service
4. Run database migrations

npm run db:migrate

5. Start all services

npm run dev


## 📦 Installation

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Bun** ([Install](https://bun.sh/))
- **Docker** & **Docker Compose** ([Install](https://docs.docker.com/get-docker/))
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)

### Step-by-Step Installation

1. **Clone the repository**


git clone https://github.com/yourusername/social-platform-backend.git

cd social-platform-backend


2. **Install dependencies**

Install root dependencies

bun install

Install all service dependencies

./scripts/install-all.sh


3. **Setup environment variables**

Copy environment templates

for service in services/*/; do
cp "$service/.env.example" "$service/.env"
done


4. **Configure databases**

Update database URLs in .env files

./scripts/fix-port-conflicts.sh


## 🔧 Configuration

### Environment Variables

Each service requires its own `.env` file:

#### User Service (services/user-service/.env)

Database

DATABASE_URL=postgresql://user_service_user:password@localhost:5433/user_service_db

JWT Secrets

JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

Redis

REDIS_URL=redis://localhost:6380

Server

PORT=3001
NODE_ENV=development
SERVICE_NAME=user-service

CORS

FRONTEND_URL=http://localhost:3000


#### Post Service (services/post-service/.env)


DATABASE_URL=postgresql://post_service_user:password@localhost:5434/post_service_db
REDIS_URL=redis://localhost:6380
PORT=3002
SERVICE_NAME=post-service


### Database Configuration

Each service has its own PostgreSQL database to ensure data isolation:

- **User Service**: `localhost:5433`
- **Post Service**: `localhost:5434`
- **Comment Service**: `localhost:5435`
- **Chat Service**: `localhost:5436`
- **Media Service**: `localhost:5437`
- **Notification Service**: `localhost:5438`
- **Analytics Service**: `localhost:5439`
- **Search Service**: `localhost:5440`

## 🐳 Docker Setup

### Development Environment


Start all infrastructure services

docker-compose up -d

Check service status

docker-compose ps

View logs

docker-compose logs -f [service-name]

Stop all services

docker-compose down


### Services Included

- **PostgreSQL databases** (8 instances for each service)
- **Redis** for caching and pub/sub
- **Elasticsearch** for search functionality
- **Prometheus** for metrics (optional)
- **Grafana** for monitoring (optional)

## 🏃‍♂️ Running the Application

### Development Mode


Start infrastructure

docker-compose up -d

Start all microservices

npm run dev

Or start individual services

npm run dev:user # User service only
npm run dev:post # Post service only
npm run dev:chat # Chat service only


### Production Mode


Build all services

npm run build

Start all services

npm start

Or use PM2 for process management

pm2 start ecosystem.config.js


### Health Checks

Verify all services are running:


Check service health

curl http://localhost:3001/health
 # User service
curl http://localhost:3002/health
 # Post service
curl http://localhost:3003/health
 # Comment service
curl http://localhost:3004/health
 # Chat service

Check databases

psql -h localhost -p 5433 -U user_service_user -d user_service_db -c "SELECT version();"

Check Redis

redis-cli -h localhost -p 6380 ping


## 📖 API Documentation

### Base URLs

- **User Service**: `http://localhost:3001`
- **Post Service**: `http://localhost:3002`
- **Comment Service**: `http://localhost:3003`
- **Chat Service**: `http://localhost:3004`

### Authentication

All API requests (except registration/login) require a JWT token:


Register a new user

curl -X POST http://localhost:3001/api/v1/auth/register

-H "Content-Type: application/json"
-d '{"username":"johndoe","email":"john@example.com
","password":"Password123!"}'

Login

curl -X POST http://localhost:3001/api/v1/auth/login

-H "Content-Type: application/json"
-d '{"email":"john@example.com
","password":"Password123!"}'

Use JWT token in subsequent requests

curl -H "Authorization: Bearer YOUR_JWT_TOKEN"
http://localhost:3001/api/v1/users/profile/user-id


### Core Endpoints

#### User Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/logout` | User logout |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/users/profile/:id` | Get user profile |
| PUT | `/api/v1/users/profile` | Update user profile |
| POST | `/api/v1/users/follow/:id` | Follow user |
| DELETE | `/api/v1/users/follow/:id` | Unfollow user |

#### Post Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/posts` | Create new post |
| GET | `/api/v1/posts/feed/:userId` | Get user feed |
| GET | `/api/v1/posts/:id` | Get specific post |
| POST | `/api/v1/posts/:id/like` | Like/unlike post |
| DELETE | `/api/v1/posts/:id` | Delete post |

#### Chat Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/chats` | Get user chats |
| POST | `/api/v1/chats` | Create new chat |
| GET | `/api/v1/chats/:id/messages` | Get chat messages |
| POST | `/api/v1/chats/:id/messages` | Send message |

### WebSocket Events (Chat Service)

```js
// Connect to chat service
const socket = io('http://localhost:3004');

// Join a chat room
socket.emit('join_chat', { chatId: 'chat-id' });

// Send message
socket.emit('send_message', {
  chatId: 'chat-id',
  content: 'Hello world!'
});

// Receive messages
socket.on('message_received', (message) => {
  console.log('New message:', message);
});

🧪 Testing
Run Tests
# Run all tests
npm run test

# Run tests for specific service
cd services/user-service && npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

Test Structure
services/user-service/
├── src/
└── tests/
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── helpers/        # Test utilities

Example Test
// services/user-service/tests/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Authentication', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('accessToken');
    });
  });
});

🚢 Deployment
Docker Production Deployment
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale user-service=3

Kubernetes Deployment
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get deployments
kubectl get services
kubectl get pods

# View logs
kubectl logs -f deployment/user-service

Environment-Specific Deployments
Environment	Branch	URL
Development	develop	http://dev-api.yourapp.com
Staging	staging	https://staging-api.yourapp.com
Production	main	https://api.yourapp.com
🤝 Contributing

We welcome contributions! Please follow these steps:

Development Workflow

Fork the repository

Create a feature branch

git checkout -b feature/amazing-feature


Make your changes

Add tests for new functionality

Run the test suite

npm run test
npm run lint


Commit your changes

git commit -m 'feat: add amazing feature'


Push to your fork

git push origin feature/amazing-feature


Create a Pull Request

Code Style

Use TypeScript for all new code

Follow ESLint and Prettier configurations

Write comprehensive tests for new features

Use conventional commits for commit messages

Document your changes in the CHANGELOG.md

Pull Request Guidelines

PRs should be focused and solve a single problem

Include tests for new functionality

Update documentation as needed

Ensure all CI checks pass

Request review from maintainers

📝 License

This project is licensed under the MIT License - see the LICENSE
 file for details.

🆘 Support
Getting Help

📖 Documentation: Check this README and inline code docs

🐛 Bug Reports: Create an issue

💡 Feature Requests: Open a feature request

💬 Discussions: Join our discussions

Maintainers

Your Name - @yourusername

Team Member - @teammember

Acknowledgments

Built with Express.js

Database management with Drizzle ORM

Real-time features powered by Socket.io

Infrastructure by Docker# ringer-microserivces

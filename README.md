# Ringer - Event-Driven Social Media Platform

A full-stack social media platform built with **Event-Driven Architecture (EDA)** using microservices.

## 🧩 Overview

Ringer is a scalable social media application that demonstrates event-driven microservice communication and real-time updates.

## ✨ Features

- **User Authentication & Authorization** – Secure login and session management  
- **Post Management** – Create, view, like, and comment on posts with real-time updates  
- **Social Interactions** – Follow/unfollow users and view follower statistics  
- **Real-Time Messaging** – WebSocket-based direct messaging between users  
- **Notifications** – Get notified when users interact with your posts  
- **User Profiles** – View post count, followers, and following statistics  
- **Home Feed** – Personalized feed with posts from followed users  
- **Timestamp Tracking** – Timezone-aware timestamps for all activities  

## 🏗️ Architecture

This project implements an **Event-Driven Architecture (EDA)** where services communicate asynchronously.

- **Microservices Design** – Each service has isolated responsibilities and can scale independently  
- **Event Producers & Consumers** – Services produce events for actions and consume events of interest  
- **Apache Kafka** – Message broker for reliable event streaming  
- **Docker Containerization** – Each service runs in isolated Docker containers  
- **WebSocket Integration** – Real-time bidirectional communication  
- **Database per Service** – Each microservice maintains its own database for isolation  

## ⚙️ Tech Stack

**Backend:**
- Node.js / Express.js  
- Apache Kafka (Event Streaming)  
- WebSocket (Real-time messaging)  
- PostgreSQL (Database)  
- Docker & Docker Compose  

**Frontend:**
- React / Next.js  
- WebSocket Client  

## 🧩 Microservices

The application consists of multiple microservices, each handling specific domain logic:

- **User Service** – User management and authentication  
- **Post Service** – Post creation and management  
- **Comment Service** – Comment handling and interactions  
- **Like Service** – Like/unlike functionality  
- **Follow Service** – Manage follow/unfollow relationships  
- **Messaging Service** – Real-time chat via WebSocket  
- **Notification Service** – User notification management  
- **API Gateway** – Request routing and orchestration  

Each service publishes events to Kafka topics when actions occur, and other services consume them asynchronously.

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose  
- Node.js (v16+)  
- Apache Kafka  
- PostgreSQL  

### Installation

```bash
git clone https://github.com/yourusername/ringer.git
cd ringer
cp .env.example .env
docker-compose up --build
docker ps
```

## ⚙️ Configuration

Configure the following in your `.env` file:
- Database connection strings for each service  
- Kafka broker URLs  
- WebSocket configuration  
- Service port mappings  
- Authentication secrets  

## 💡 Usage

### Demo Users
- Sarah Johnson  
- Mike Chen  

### Example Workflows

**Creating a Post:**
1. Navigate to "Create" page  
2. Enter post content  
3. Submit – Post appears instantly in feed  

**Real-Time Messaging:**
1. Navigate to Messages  
2. Select a user you follow (mutual follow)  
3. Send message – Delivered instantly via WebSocket  

## 🔄 Event Flow Example

When a user creates a post:
1. **Post Service** saves post to database  
2. Publishes `POST_CREATED` event to Kafka  
3. **Notification Service** consumes event and creates notifications for followers  
4. **Feed Service** updates relevant user feeds asynchronously  

## ⚡ Real-Time Features

- **Instant Messaging** – Delivered via WebSocket  
- **Live Notifications** – Real-time updates  
- **Dynamic Feed Updates** – Auto-refresh feed  
- **Timezone-Aware Timestamps**  

## 🐳 Docker Services

List running containerized services:

```bash
docker ps
```

Each service runs with:
- Isolated port mapping  
- Dedicated database  
- Kafka producer/consumer config  
- Health check monitoring  

## 🧪 Testing

1. Open multiple browser sessions  
2. Perform actions (post, like, message) in one session  
3. Observe real-time updates in others  
4. Refresh to confirm database persistence  

## 🗃️ Database Persistence

All actions are persisted to PostgreSQL databases:
- Posts  
- Comments  
- Likes  
- Follows  
- Messages  
- Notifications  

## 👨‍💻 Author

**Ravi**

---

Built with ❤️ using Event-Driven Architecture and Microservices.

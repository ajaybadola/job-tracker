JobTrack Pro
A Cloud-Native MERN Stack Application for Job Tracking
JobTrack Pro is a high-performance, full-stack application designed for developers to manage and track their job applications. Built with a focus on Security, Cloud Scalability, and DevOps best practices.

🛠️ Tech Stack
Frontend: React.js, Tailwind CSS (Hosted on Vercel)

Backend: Node.js, Express.js (Hosted on Render)

Database: PostgreSQL (Relational Data Management)

Authentication: AWS Cognito (Enterprise-grade OAuth 2.0 / OIDC)

Infrastructure: Monorepo architecture, Environment-driven configuration

🌟 Key Features
Secure Auth: Integrated AWS Cognito for user identity management with Authorization Code Grant flow.

Live Dashboard: Real-time tracking of application status (Applied, Interview, Offer, Rejected).

Environment Sync: Seamlessly configured for Local Development and Production environments via specialized env mapping.

Microservices Design: Decoupled Frontend and Backend deployment for optimized scaling and performance.

Developer UI: Terminal-inspired dashboard aesthetic for a unique "Dev-First" experience.

⚙️ Cloud & DevOps Configuration
Authentication Flow
Configured Allowed Callback URLs for both development (localhost:5173) and production (vercel.app).

Implemented CORS policy on the backend to allow secure requests from the Vercel-hosted frontend.

Deployment Pipeline
Frontend (Vercel): Automatic deployments triggered by GitHub pushes.

Backend (Render): Managed Node environment connected to a managed PostgreSQL instance.

API Management: Centralized VITE_API_URL environment variables for consistent routing.

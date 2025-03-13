# CLAUDE.md - Educational App Codebase Guide

## Build/Run Commands
- Frontend: `cd frontend && npm start` - Runs React frontend
- Backend: `./lancia-locale.sh backend` - Starts all microservices
- All Services: `./lancia-locale.sh start` - Starts frontend and backend
- Setup: `./lancia-locale.sh setup` - Initialize development environment
- Status: `./lancia-locale.sh status` - Check service status
- Stop: `./lancia-locale.sh stop` - Stop all services

## Test Commands
- Frontend Tests: `cd frontend && npm test` (Jest)
- Single Frontend Test: `cd frontend && npm test -- -t "test name"` 
- E2E Tests: `cd frontend && npm test tests/e2e/TestName.test.js`
- Backend Tests: `cd backend/[service-name] && pytest` (e.g., `cd backend/auth-service && pytest`)
- Single Backend Test: `cd backend/[service-name] && pytest tests/unit/test_file.py::test_function`

## Linting/Formatting
- Frontend: Uses ESLint with React App config (extends react-app)
- TypeScript: `cd frontend && npx tsc --noEmit` - Type checking

## Code Style Guidelines
- TypeScript: Strict mode enabled, use proper types
- React: Functional components with hooks, use Framer Motion for animations
- Backend: FastAPI with SQLAlchemy ORM, Pydantic V2
- Authentication: OAuth2 with JWT tokens, refresh mechanism, role-based access control
- Imports: Use absolute imports from 'src/' in frontend
- Error handling: Use ApiErrorHandler with NotificationsContext for frontend errors
- Naming: PascalCase for components, camelCase for variables/functions
- Services: Always implement proper error handling and authentication

## Architecture
- Microservices: auth-service, quiz-service, path-service, reward-service, api-gateway
- Frontend: React with MUI, Context API for state management
- Animations: Framer Motion library for transitions and UX elements
- Testing: Jest/React Testing Library (frontend), pytest (backend)

## Known Issues
- JWT token format incompatibility between frontend and backend - high priority
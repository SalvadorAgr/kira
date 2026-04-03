# Kira Project Guidelines

## Code Style
- **Python**: snake_case for files, functions, and variables (e.g., `model_orchestrator.py`, `get_model_recommendation()`)
- **React/TypeScript**: PascalCase for components (e.g., `ChatInterface.tsx`), camelCase for functions and variables
- **API routes**: kebab-case with `/api/` prefix (e.g., `/api/chat/enhanced`)
- **Database**: snake_case tables with foreign key relationships

## Architecture
- **Frontend** (React 19 + Electron): UI on port 9407, stateless, uses React Context for project management
- **Backend** (FastAPI): REST API on port 8000, SQLite persistence, CORS open
- **Core subsystems**:
  - Model Orchestrator: Routes tasks between 270M (fast) and 1B (powerful) models based on regex complexity patterns
  - Approval System: Mandatory gate for system operations with 30s timeout and audit trail
  - Anti-Hallucination Validator: Sanitizes responses for safety and relevance
- **Tools**: macOS-specific system integrations via AppleScript, wrapped as LangChain tools

## Build and Test
- **Backend setup**: `pip install -r backend/requirements.txt && python3 backend/initialize_models.py && python3 backend/main.py`
- **Frontend setup**: `cd frontend && npm install && npm run dev` (or `npm start` for Electron)
- **Models**: Must be initialized to `./models/Qwen2.5-1.5B-Instruct-Q8_0.gguf` before backend starts
- **No automated tests**: Manual testing only, verify both ports (8000, 9407) are free

## Conventions
- **Chat history**: Per-project isolation, 50-message fetch limit, auto-saved before processing
- **Message format**: `{role, content, id, timestamp}` with metadata
- **Project management**: Default project "General" (ID 1), context switches load full history
- **Security**: All system tools require approval, auto-deny dangerous commands
- **Bilingual**: Spanish comments acceptable, English code preferred

See [ENHANCED_README.md](ENHANCED_README.md) for user-facing features, API examples, and troubleshooting.
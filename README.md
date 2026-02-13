# 🎓 Study Buddy

An AI-powered study companion that transforms your PDFs into an interactive learning experience. Upload course materials, chat with your documents, generate quizzes, and get personalized tutoring — all in one place.

---

## ✨ Features

| Feature | Description |
|---|---|
| **📄 PDF Ingestion** | Upload PDFs — automatically parsed, chunked, and vector-indexed for semantic search |
| **🤖 RAG Chat** | Chat with your documents using Retrieval-Augmented Generation (Groq / Ollama) |
| **💬 General Chat** | AI assistant for general questions, independent of any document |
| **🌐 Web Search** | Real-time web search integration powered by DuckDuckGo for up-to-date answers |
| **🎭 AI Personas** | Choose a tutoring style — Socratic Tutor, Explain Like I'm 5, Strict Professor, and more |
| **📝 Quiz Generation** | Instantly generate interactive multiple-choice quizzes from your study material |
| **📍 Citation Tracking** | Every answer includes source citations with page references |
| **🔗 Knowledge Graphs** | Neo4j-powered knowledge maps linking concepts across documents |
| **👁️ Vision Analysis** | OCR and image analysis for scanned PDFs using Ollama vision models |
| **📧 Email Notifications** | Get notified when document processing completes |
| **🔐 Secure Auth** | Google OAuth 2.0 + JWT authentication |
| **🌙 Dark Mode** | Full light/dark/system theme support |
| **📱 Responsive** | Mobile-optimized UI with adaptive layouts |

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL + pgvector (vector embeddings)
- **Graph DB**: Neo4j (knowledge graphs)
- **ORM**: SQLAlchemy (Async)
- **LLM**: Groq API (Llama 3) / Ollama (local models)
- **Embeddings**: Sentence-Transformers (`all-MiniLM-L6-v2`)
- **PDF Processing**: PyMuPDF
- **Web Search**: DuckDuckGo Search API
- **Email**: FastAPI-Mail (Gmail SMTP)

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 (glassmorphism design)
- **State Management**: Zustand
- **Auth**: Google OAuth (`@react-oauth/google`) + JWT
- **Icons**: Lucide React

---

## 📁 Project Structure

```
study-buddy/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers (auth, chat, documents, quiz)
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   │   ├── ingestion.py       # PDF processing pipeline
│   │   │   ├── llm.py             # LLM integration (Groq/Ollama)
│   │   │   ├── vector_search.py   # Semantic search
│   │   │   ├── hybrid_search.py   # Combined search strategies
│   │   │   ├── web_search.py      # DuckDuckGo integration
│   │   │   ├── graph_service.py   # Neo4j knowledge graphs
│   │   │   ├── persona.py         # AI persona definitions
│   │   │   ├── vision_service.py  # OCR / image analysis
│   │   │   └── email_service.py   # Email notifications
│   │   └── main.py         # FastAPI app entry point
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   └── .env.example        # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (Dashboard, Study, Login)
│   │   ├── services/       # API client services
│   │   ├── stores/         # Zustand state stores
│   │   └── contexts/       # React contexts (Theme)
│   └── .env.example        # Frontend env template
└── docker-compose.yml      # PostgreSQL + Neo4j containers
```

---

## 🚀 Getting Started

### Prerequisites
- **Docker & Docker Compose** (for PostgreSQL + Neo4j)
- **Node.js 18+**
- **Python 3.11+** with [uv](https://docs.astral.sh/uv/) package manager
- **Groq API Key** — [Get one free](https://console.groq.com)
- **Google OAuth Client ID** — [Create credentials](https://console.cloud.google.com/apis/credentials)

### 1. Clone & Configure

```bash
git clone <repo-url>
cd study-buddy
```

**Backend environment:**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in the required values:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key for LLM access |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `JWT_SECRET` | Random secret for JWT signing |
| `MAIL_USERNAME` | Gmail address for notifications |
| `MAIL_PASSWORD` | Gmail App Password (16-char) |

**Frontend environment:**
```bash
cp frontend/.env.example frontend/.env
```

Set the following variables in `frontend/.env`:

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_API_URL` | Base URL for the backend API (e.g., `http://localhost:8000/api` or ngrok URL) |
| `VITE_SUPPORT_EMAIL` | (Optional) Support email shown on fallback screens |

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** (with pgvector) on port `5433`
- **Neo4j** on ports `7474` (browser) and `7687` (bolt)

### 3. Run the Backend

```bash
cd backend
uv sync                                          # Install dependencies
uv run alembic upgrade head                      # Run database migrations
uv run uvicorn app.main:app --reload --port 8000 # Start API server
```

The API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** to start studying!

---

## 🌐 Deployment

Study Buddy is configured for a hybrid deployment model:
- **Frontend**: Hosted on **GitHub Pages** (automatically via GitHub Actions).
- **Backend**: Hosted on your **Local Machine** and exposed via **ngrok**.

### 1. Backend Connectivity (ngrok)
To allow the GitHub Pages frontend to reach your local backend:
1.  Install [ngrok](https://ngrok.com/).
2.  Run the backend locally (port 8000).
3.  Expose it: `ngrok http 8000`.
4.  Copy the `https://...` URL provided by ngrok.

### 2. GitHub Secrets
In your GitHub repository settings, add the following **Actions Secrets**:
- `VITE_API_URL`: Your ngrok URL (e.g., `https://random-id.ngrok-free.app/api`).
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
- `VITE_SUPPORT_EMAIL`: Your support contact (e.g., `study1997buddy@gmail.com`).

### 3. Automated CI/CD
Every push to the `master` branch triggers the `.github/workflows/deploy.yml` workflow, which builds the React app with your secrets and deploys it to the `gh-pages` branch.

---

## 🛡️ Backend Health Monitoring

The frontend includes a built-in health monitor:
- **Detection**: Every 30 seconds, the app checks if the backend API is reachable.
- **Fallback UI**: If the ngrok tunnel or local server is down, a premium "Server Connection Lost" screen appears automatically.
- **Auto-Recovery**: As soon as the backend is restored, the app detects it and returns to the dashboard without a refresh.

---

## 🧪 Testing

```bash
cd backend
uv run pytest
```

---

## 🔧 Optional: Local AI with Ollama

For fully offline LLM support, install [Ollama](https://ollama.com) and pull models:

```bash
ollama pull llama3.2:1b     # Text model
ollama pull moondream        # Vision model (for OCR)
```

Ensure `OLLAMA_BASE_URL=http://localhost:11434` is set in your `.env`.

---

## 📝 License

MIT

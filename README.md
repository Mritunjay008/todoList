# TaskFlow — Modern Full-Stack Todo Application

A modern, high-performance Todo & Task Management application built with a **React 19 + Vite** frontend and an **ASP.NET Core 8 Web API** backend with **Entity Framework Core** and **SQLite** persistence.

---

## 🌟 Key Features

### 🖥️ Frontend (React 19 + Vite)
- **Fluid & Modern Design**: Custom design system built with CSS variables (HSL tokens), subtle elevation shadows, micro-interactions, and responsive layout.
- **Dark & Light Mode**: Seamless theme switching with persistence in local storage.
- **Interactive Statistics Bar**: Real-time metrics for Total Tasks, Active/In-Progress, Completed (with animated progress bar), Overdue, and High/Urgent priority counts.
- **Rich Filtering & Search**:
  - Full-text search across task titles, descriptions, and tags (`/` shortcut).
  - Status tabs (*All*, *Active*, *Completed*).
  - Priority filter (*Urgent*, *High*, *Medium*, *Low*).
  - Category pill filter with support for custom user-created categories.
  - Multi-attribute sorting (Creation Date, Due Date, Priority, Title) in ascending or descending order.
- **Quick-Add & Full Modal Creator**:
  - Inline single-click quick task creation.
  - Comprehensive modal editor with title, description, priority buttons, categories, datetime-local picker, and tags chips (`N` shortcut).
- **Batch Actions**: One-click clear/delete all completed tasks.
- **Smart Due Date Badges**: Automatic relative time calculation (`Overdue by X hours`, `Due Today`, `Due Tomorrow`, `Due in X days`).
- **Resilient Offline Fallback**: Works offline with in-memory caching and real-time backend connection status indicator.

### ⚙️ Backend (.NET 8 Web API)
- **Clean RESTful Architecture**:
  - `GET /api/todos` — Query & filter tasks with sorting, status, category, priority, and search parameters.
  - `GET /api/todos/{id}` — Fetch single task details.
  - `POST /api/todos` — Create new task with validation.
  - `PUT /api/todos/{id}` — Update existing task details.
  - `PATCH /api/todos/{id}/toggle` — Quick completion toggle with timestamp management.
  - `DELETE /api/todos/{id}` — Delete single task.
  - `DELETE /api/todos/completed` — Bulk delete completed tasks.
  - `GET /api/todos/stats` — Summary aggregation statistics, completion rate, and category/priority breakdowns.
  - `GET /api/todos/categories` — Retrieve list of active and default categories.
- **Persistence**: Entity Framework Core 8 with SQLite database (`todos.db`) and automatic schema creation and initial seeding.
- **Swagger / OpenAPI**: Interactive API documentation at `http://localhost:5044/swagger`.
- **CORS Configured**: Configured for local development across multiple client ports.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) & npm
- .NET 8 SDK (Installed in `$HOME/.dotnet` or system path)

### Option 1: One-Click Launch (PowerShell)
Run the automated launcher script from the root directory:
```powershell
.\start.ps1
```

### Option 2: Run Services Individually

#### 1. Start the .NET 8 Backend API
```powershell
cd backend
dotnet run --urls http://localhost:5044
```
> Swagger UI will be available at: [http://localhost:5044/swagger](http://localhost:5044/swagger)

#### 2. Start the React Frontend
In another terminal:
```powershell
cd frontend
npm install
npm run dev
```
> Access the React application at: [http://localhost:5173](http://localhost:5173)

---

## ⌨️ Keyboard Shortcuts
- <kbd>N</kbd> — Open the **New Task** modal
- <kbd>/</kbd> — Focus the **Search** bar
- <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (or <kbd>Cmd</kbd> + <kbd>Enter</kbd>) — Save and submit modal form
- <kbd>Esc</kbd> — Close modal dialog

---

## 📁 Project Structure

```
todoList/
├── backend/
│   ├── Controllers/
│   │   └── TodosController.cs     # REST API Controller endpoints
│   ├── Data/
│   │   └── TodoDbContext.cs       # EF Core SQLite DbContext & Seed Data
│   ├── DTOs/
│   │   ├── CreateTodoDto.cs       # Creation request DTO
│   │   ├── UpdateTodoDto.cs       # Update request DTO
│   │   └── TodoStatsDto.cs        # Statistics response DTO
│   ├── Models/
│   │   └── TodoItem.cs            # Core Todo entity model
│   ├── Program.cs                 # App entry point, CORS, SQLite setup
│   └── appsettings.json           # Connection strings & configurations
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Header, theme toggle, API status
│   │   │   ├── StatsOverview.jsx  # Metric cards & progress bar
│   │   │   ├── FilterBar.jsx      # Search, tabs, categories, sorting
│   │   │   ├── TodoList.jsx       # Task list container & inline add
│   │   │   ├── TodoItem.jsx       # Individual task card with badges
│   │   │   ├── TodoModal.jsx      # Create/Edit task modal dialog
│   │   │   └── Toast.jsx          # Notification toast container
│   │   ├── services/
│   │   │   └── api.js             # Fetch API client
│   │   ├── App.jsx                # Main application component
│   │   ├── index.css              # Custom HSL design system & theme tokens
│   │   └── main.jsx               # React DOM entry point
│   ├── vite.config.js             # Vite config with /api proxy
│   └── package.json
│
├── start.ps1                      # Unified PowerShell launch script
├── package.json                   # Root convenience scripts
└── README.md                      # Documentation
```

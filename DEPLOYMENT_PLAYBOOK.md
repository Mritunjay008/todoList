# 📘 Full-Stack Azure Zero-Trust Deployment Playbook
### React 19 Frontend + ASP.NET Core 8 Web API + Azure SQL Database (PaaS)
*A complete chronological log of development, CI/CD pipeline setup, Azure architecture, troubleshooting, and step-by-step reproduction guide.*

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Chronological Timeline & Journey](#-chronological-timeline--journey)
3. [All Failures, Root Causes & Resolutions](#-all-failures-root-causes--resolutions)
4. [Step-by-Step Reproduction Guide (From Scratch)](#-step-by-step-reproduction-guide-from-scratch)
   - [Phase 1: Local Application Development](#phase-1-local-application-development)
   - [Phase 2: GitHub Repository & CI/CD Pipelines](#phase-2-github-repository--cicd-pipelines)
   - [Phase 3: Azure Network Infrastructure (VNet & Subnets)](#phase-3-azure-network-infrastructure-vnet--subnets)
   - [Phase 4: Frontend App Service Deployment](#phase-4-frontend-app-service-deployment)
   - [Phase 5: Backend App Service (Private Endpoint) Deployment](#phase-5-backend-app-service-private-endpoint-deployment)
   - [Phase 6: Azure SQL Database (PaaS Private Endpoint) Setup](#phase-6-azure-sql-database-paas-private-endpoint-setup)
   - [Phase 7: End-to-End Verification](#phase-7-end-to-end-verification)
5. [Configuration & Environment Variables Reference](#-configuration--environment-variables-reference)

---

## 🏛 Architecture Overview

```
[ User Browser (Public Internet) ]
                │
                │ 1. Public HTTPS (Port 443)
                ▼
┌──────────────────────────────────────────────────────────────────┐
│ TIER 1: FRONTEND WEB APP (Public Azure App Service)              │
│ • Runs React 19 SPA + Node.js Reverse Proxy (`server.js`)        │
│ • Outbound VNet Integration ➔ `frontend-subnet`                  │
│ • Intercepts `/api/*` and proxies internally over Azure VNet    │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                │ 2. Internal VNet Traffic
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ TIER 2: BACKEND WEB API (Private Azure App Service)              │
│ • ASP.NET Core 8 Web API                                         │
│ • Public Network Access: BLOCKED (No Public IP)                  │
│ • Inbound Private Endpoint ➔ `backend-subnet` (10.0.2.x)         │
│ • Outbound VNet Integration ➔ `frontend-subnet`                  │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                │ 3. Private VNet Traffic (Port 1433)
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ TIER 3: AZURE SQL DATABASE (PaaS Private Endpoint)               │
│ • Public Network Access: DISABLED                                │
│ • Inbound Private Endpoint ➔ `database-subnet` (10.0.3.x)        │
│ • Private DNS Zone: `privatelink.database.windows.net`           │
└──────────────────────────────────────────────────────────────────┘
```

---

## ⏱ Chronological Timeline & Journey

### Day 1: Project Scaffolding & Local Full-Stack Setup
1. **Local Environment Check:** Discovered .NET SDK was missing in the environment. Downloaded and installed .NET 8.0.424 SDK via PowerShell script and updated user `PATH`.
2. **React 19 Frontend Initialized:** Scaffolded via Vite with `lucide-react`, custom HSL design system, dark/light mode toggle, live status indicators, modals, filters, and priority badges.
3. **ASP.NET Core 8 Web API Created:** Implemented `TodosController` with full CRUD, stats, filtering, sorting, seed data, and EF Core SQLite.
4. **Git Repository Sanitized:** Added a comprehensive root `.gitignore` to prevent checking in `node_modules/`, `bin/`, `obj/`, and `todos.db`.

### Day 2: CI/CD Pipeline Construction
1. **3-Stage CI Workflows:** Created `ci-web.yml` and `ci-api.yml` following the `Test ➔ Lint ➔ Build Artifact` structure.
2. **CD Workflows:** Created `cd-web.yml` and `cd-api.yml` using `workflow_run` triggers to download build artifacts and deploy via `azure/webapps-deploy@v3`.
3. **Frontend Initial Cloud Deployment:** Provisioned Frontend Azure Web App (`todo-frontend-fzh4bzavcegngqc9`).

### Day 3: Cloud Hardening & Zero-Trust Private Network Implementation
1. **Azure Virtual Network (`todo-vnet`):** Created CIDR `10.0.0.0/16` with subnets for frontend egress, backend private endpoint, and database.
2. **Backend Web App Provisioned:** Deployed ASP.NET Core 8 with Inbound Private Endpoint inside `backend-subnet`.
3. **Frontend Reverse Proxy:** Enhanced `server.js` to act as a Backend-For-Frontend (BFF) reverse proxy to forward `/api/*` requests over VNet.
4. **Azure SQL Database (PaaS) Provisioned:** Upgraded data layer from SQLite to Azure SQL Server using EF Core `Microsoft.EntityFrameworkCore.SqlServer` with connection retry logic (`EnableRetryOnFailure`) and Inbound Private Endpoint on `database-subnet`.
5. **Full Stack Live:** Verified full 3-tier private communication end-to-end.

---

## 🛠 All Failures, Root Causes & Resolutions

Below is the complete troubleshooting log of every issue encountered during this project:

| # | Error / Issue Encountered | Root Cause | Exact Resolution Applied |
|---|---|---|---|
| **1** | `error NU1202: Package Microsoft.EntityFrameworkCore.Sqlite 10.0.11 is not compatible with net8.0` | `dotnet add package` defaulted to .NET 10 preview packages when no version was explicitly passed. | Explicitly pinned package versions: `dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.11`. |
| **2** | `Error: Deployment Failed, Error: Publish profile is invalid for app-name and slot-name provided` | Basic authentication (SCM) was disabled in Azure Portal when the profile was downloaded, causing empty credentials in the XML. Also, secret contained domain suffix. | 1. In Azure Portal: **Configuration ➔ General settings ➔ SCM basic auth: ON ➔ Save**.<br>2. Re-downloaded publish profile.<br>3. Set `AZURE_FRONTEND_APP_NAME` to strictly `todo-frontend-fzh4bzavcegngqc9` (no domain suffix). |
| **3** | Deployed Frontend site was blank / showing default Azure hosting page | Azure Linux Node.js App Service expects an entrypoint (`server.js` / `package.json`) or static web server config to serve SPA `index.html`. | Created zero-dependency `server.js` and `package.json` in `frontend/public/` so Vite bundles them directly into `dist/`. |
| **4** | Backend CI/CD pipeline did not trigger automatically on Git push | `ci-api.yml` had a `paths: ['backend/**', '.github/workflows/ci-api.yml']` filter. Previous commit only touched `frontend/`. | Expected behavior. Triggered workflow manually via GitHub Actions **"Run workflow"** button, or pushed a commit modifying `backend/`. |
| **5** | `Ip Forbidden (CODE: 403) - Failed to deploy web package using OneDeploy to App Service` | Backend Web App had Public Network Access disabled, which blocked GitHub Actions public runners from reaching the SCM deployment site. | In Backend Web App **Networking ➔ Public network access**: Selected **"Enabled from selected virtual networks and IP addresses"**, set Main site to **Deny**, and uncoupled SCM / Advanced tool site with **Allow**. |
| **6** | `502 Bad Gateway` on `/api/todos` requests from frontend | Frontend App Service was trying to resolve the backend's private domain using public DNS instead of Azure internal VNet DNS. | Added two Application Settings to Frontend Web App:<br>1. `WEBSITE_VNET_ROUTE_ALL` = `1`<br>2. `WEBSITE_DNS_SERVER` = `168.63.129.16` |
| **7** | Local backend build failure: `The file is locked by backend (PID)` | An earlier background local .NET process was holding a file lock on `backend.exe`. | Ran `Stop-Process -Id <PID> -Force` to kill the zombie process and re-ran `dotnet build`. |
| **8** | Forgotten SQL Admin username and password | User was unsure of the credentials entered during SQL server wizard creation. | Navigated to **SQL servers ➔ Overview** to find the Server Admin username, and clicked **"Reset password"** on the top toolbar to set a new password. |

---

## 📖 Step-by-Step Reproduction Guide (From Scratch)

Follow this guide to rebuild and redeploy this exact solution from scratch anytime.

---

### Phase 1: Local Application Development

#### 1. Backend Setup (.NET 8 Web API)
```powershell
# Create backend directory & scaffold Web API
mkdir todoList; cd todoList
dotnet new webapi -o backend --use-controllers

# Add Entity Framework Core packages (pinned to .NET 8)
cd backend
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.11
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.11
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.11
```

- Configure `Program.cs` for dynamic database switching (Azure SQL vs SQLite) and CORS:
```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=todos.db";
var isSqlServer = connectionString.Contains("database.windows.net", StringComparison.OrdinalIgnoreCase) ||
                  connectionString.Contains("Server=tcp:", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<TodoDbContext>(options => {
    if (isSqlServer)
        options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(5));
    else
        options.UseSqlite(connectionString);
});
```

#### 2. Frontend Setup (React 19 + Vite)
```powershell
cd ..
npx -y create-vite@latest frontend --template react
cd frontend
npm install lucide-react
```

- In `frontend/public/`, create:
  1. `web.config` (for Windows IIS URL rewriting to `index.html`)
  2. `server.js` (for Linux Node static file serving + `/api` reverse proxy to `BACKEND_API_URL`)
  3. `package.json` with `"start": "node server.js"`

---

### Phase 2: GitHub Repository & CI/CD Pipelines

#### 1. Root `.gitignore`
Create `.gitignore` at the project root:
```gitignore
**/bin/
**/obj/
**/node_modules/
**/dist/
*.db*
.env*
.vs/
.idea/
```

#### 2. GitHub Actions Workflows (in `.github/workflows/`)

- **Frontend CI (`ci-web.yml`)**:
  - Triggers on push to `frontend/**`.
  - Runs `test` ➔ `lint` (`oxlint`) ➔ `build-artifact` (`npm run build`).
  - Uploads `frontend/dist` as `frontend-build-artifact`.

- **Frontend CD (`cd-web.yml`)**:
  - Triggers on `workflow_run` when `Frontend CI Pipeline` finishes.
  - Downloads `frontend-build-artifact`.
  - Deploys to Azure Web App via `azure/webapps-deploy@v3` using secrets `AZURE_FRONTEND_APP_NAME` and `AZURE_FRONTEND_PUBLISH_PROFILE`.

- **Backend CI (`ci-api.yml`)**:
  - Triggers on push to `backend/**`.
  - Runs `test` ➔ `lint` ➔ `build-artifact` (`dotnet publish -c Release -o ./publish`).
  - Uploads `./publish` as `api-build-artifact`.

- **Backend CD (`cd-api.yml`)**:
  - Triggers on `workflow_run` when `Backend CI Pipeline` finishes.
  - Downloads `api-build-artifact`.
  - Deploys to Azure Web App via `azure/webapps-deploy@v3` using secrets `AZURE_BACKEND_APP_NAME` and `AZURE_BACKEND_PUBLISH_PROFILE`.

---

### Phase 3: Azure Network Infrastructure (VNet & Subnets)

1. In Azure Portal, search **Virtual Networks** ➔ **Create**:
   - **Name:** `todo-vnet`
   - **Region:** `Central India` *(or your region)*
   - **Security tab:** Disable Bastion, DDoS Protection, Firewall.
   - **IP Addresses tab:** Address Space: `10.0.0.0/16`.
2. Add Subnets:
   - `frontend-subnet`: `10.0.1.0/24` (Delegation: `Microsoft.Web/serverFarms`).
   - `backend-subnet`: `10.0.2.0/24` (Delegation: `None`).
   - `database-subnet`: `10.0.3.0/24` (Delegation: `None`).

---

### Phase 4: Frontend App Service Deployment

1. **Create Web App:**
   - **Name:** `todo-frontend-xxxx`
   - **Runtime:** `Node 20 LTS` (Linux)
   - **Plan:** Basic `B1` or Free `F1` (Same Resource Group as VNet)
2. **Enable Basic Auth & Get Publish Profile:**
   - Go to **Configuration ➔ General settings ➔ SCM basic auth: ON ➔ Save**.
   - Overview ➔ Click **Get publish profile**.
3. **Configure VNet Integration:**
   - Go to **Networking ➔ Virtual network integration ➔ Add VNet integration**:
   - Select `todo-vnet` and `frontend-subnet`.
4. **Set GitHub Secrets:**
   - `AZURE_FRONTEND_APP_NAME`: `todo-frontend-xxxx`
   - `AZURE_FRONTEND_PUBLISH_PROFILE`: *(Paste XML)*

---

### Phase 5: Backend App Service (Private Endpoint) Deployment

1. **Create Web App:**
   - **Name:** `todo-api-xxxx`
   - **Runtime:** `.NET 8 (LTS)` (Linux)
   - **Plan:** Select same App Service Plan as Frontend.
2. **Configure Inbound Private Endpoint:**
   - Under **Networking ➔ Private endpoints ➔ + Add private endpoint**:
     - Name: `backend-endpoint`
     - VNet: `todo-vnet`
     - Subnet: `backend-subnet`
     - Private DNS Zone: **Yes** (`privatelink.azurewebsites.net`).
3. **Configure Access Restrictions for GitHub Actions Deployment:**
   - Under **Networking ➔ Public network access**:
     - Mode: **Enabled from selected virtual networks and IP addresses**.
     - Main Site rule: **Deny**.
     - Advanced Tool (SCM) site: **Allow**.
4. **Enable SCM Basic Auth & Get Publish Profile:**
   - Under **Configuration ➔ General settings ➔ SCM basic auth: ON ➔ Save**.
   - Overview ➔ Click **Get publish profile**.
5. **Set GitHub Secrets:**
   - `AZURE_BACKEND_APP_NAME`: `todo-api-xxxx`
   - `AZURE_BACKEND_PUBLISH_PROFILE`: *(Paste XML)*

---

### Phase 6: Azure SQL Database (PaaS Private Endpoint) Setup

1. **Create Azure SQL Database:**
   - **Database Name:** `tododb`
   - **Server:** Click Create New (Select **SQL Authentication**, choose admin username and password).
   - **Compute + Storage:** Select **Basic (5 DTUs)** or **Serverless** (Dev environment).
2. **Networking (Private Endpoint):**
   - Connectivity method: **Private endpoint**.
   - Add Private Endpoint:
     - Name: `sql-private-endpoint`
     - VNet: `todo-vnet`
     - Subnet: `database-subnet`
     - Private DNS Zone: **Yes** (`privatelink.database.windows.net`).
3. **Retrieve Connection String:**
   - In SQL Database ➔ **Connection strings ➔ ADO.NET**:
     ```text
     Server=tcp:<server-name>.database.windows.net,1433;Initial Catalog=tododb;Persist Security Info=False;User ID=<admin-user>;Password=<admin-password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
     ```

---

### Phase 7: End-to-End Verification

1. **In Backend Web App (`todo-api-xxxx`) ➔ Configuration:**
   - Add Connection String:
     - **Name:** `DefaultConnection`
     - **Value:** *(Azure SQL Connection string from Phase 6)*
     - **Type:** `SQLAzure`
   - Add App Setting: `WEBSITE_VNET_ROUTE_ALL` = `1`
   - Add App Setting: `WEBSITE_DNS_SERVER` = `168.63.129.16`
   - Click **Save** and **Restart**.

2. **In Frontend Web App (`todo-frontend-xxxx`) ➔ Configuration:**
   - Add App Setting: `BACKEND_API_URL` = `https://todo-api-xxxx.azurewebsites.net`
   - Add App Setting: `WEBSITE_VNET_ROUTE_ALL` = `1`
   - Add App Setting: `WEBSITE_DNS_SERVER` = `168.63.129.16`
   - Click **Save** and **Restart**.

3. **Visit Your Public Website:**
   - Open: `https://todo-frontend-xxxx.azurewebsites.net`
   - Verify badges show: 🟢 **`API Connected`** and 🟢 **`Azure SQL Server`**.
   - Create and manipulate tasks live!

---

## ⚙️ Configuration & Environment Variables Reference

### Frontend Web App Settings:
| Setting Name | Recommended Value | Purpose |
|---|---|---|
| `BACKEND_API_URL` | `https://todo-api-xxxx.azurewebsites.net` | Target private backend URL for Node reverse proxy |
| `WEBSITE_VNET_ROUTE_ALL` | `1` | Forces all outbound app traffic through the Azure VNet |
| `WEBSITE_DNS_SERVER` | `168.63.129.16` | Azure internal DNS resolver IP for Private Endpoints |

### Backend Web App Settings:
| Setting Name | Recommended Value | Purpose |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | `Server=tcp:<server>.database.windows.net...` | Connection string to private Azure SQL Database |
| `WEBSITE_VNET_ROUTE_ALL` | `1` | Forces SQL database queries through VNet to `database-subnet` |
| `WEBSITE_DNS_SERVER` | `168.63.129.16` | Resolves `privatelink.database.windows.net` internally |

### GitHub Secrets:
| Secret Name | Description |
|---|---|
| `AZURE_FRONTEND_APP_NAME` | Name of Frontend Web App |
| `AZURE_FRONTEND_PUBLISH_PROFILE` | Publish profile XML content of Frontend Web App |
| `AZURE_BACKEND_APP_NAME` | Name of Backend Web App |
| `AZURE_BACKEND_PUBLISH_PROFILE` | Publish profile XML content of Backend Web App |

---
*Created with ❤️ by Antigravity Assistant • Ready for production reproduction.*

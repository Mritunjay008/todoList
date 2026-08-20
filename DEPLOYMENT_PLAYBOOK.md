# 📘 Full-Stack Azure Zero-Trust Deployment Playbook
### React 19 Frontend + ASP.NET Core 8 Web API + Azure SQL Database (PaaS)
*A complete chronological log of development, CI/CD pipeline setup, Azure architecture, troubleshooting, and step-by-step reproduction guide.*

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Chronological Timeline & Journey](#-chronological-timeline--journey)
3. [All Failures, Root Causes & Resolutions](#-all-failures-root-causes--resolutions)
4. [Step-by-Step Reproduction Guide (Exact Chronological Order)](#-step-by-step-reproduction-guide-exact-chronological-order)
   - [Phase 1: Local Application Development](#phase-1-local-application-development)
   - [Phase 2: GitHub Repository & CI/CD Pipelines](#phase-2-github-repository--cicd-pipelines)
   - [Phase 3: Frontend Azure App Service Deployment (Public)](#phase-3-frontend-azure-app-service-deployment-public)
   - [Phase 4: Azure Virtual Network (VNet) & Subnet Design](#phase-4-azure-virtual-network-vnet--subnet-design)
   - [Phase 5: Backend Azure App Service (Private Endpoint) Deployment](#phase-5-backend-azure-app-service-private-endpoint-deployment)
   - [Phase 6: Azure SQL Database (PaaS Private Endpoint) Setup](#phase-6-azure-sql-database-paas-private-endpoint-setup)
   - [Phase 7: End-to-End Verification & Health Indicators](#phase-7-end-to-end-verification--health-indicators)
5. [Configuration & Environment Variables Reference](#-configuration--environment-variables-reference)
6. [🎤 Lead Walkthrough Script & Presentation Notes](#-lead-walkthrough-script--presentation-notes)

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

### Step 1: Local Full-Stack Development
- Scaffolded React 19 + Vite frontend and ASP.NET Core 8 Web API backend with SQLite and full CRUD.
- Sanitized Git repository with a comprehensive `.gitignore`.

### Step 2: CI/CD Workflows Setup
- Created 3-stage CI pipelines (`Test ➔ Lint ➔ Build Artifact`) in `ci-web.yml` and `ci-api.yml`.
- Created decoupled CD deployment pipelines in `cd-web.yml` and `cd-api.yml`.

### Step 3: Frontend App Service Deployment (Public)
- Created the Frontend Web App on Azure App Service (`todo-frontend-fzh4bzavcegngqc9`).
- Enabled SCM Basic Auth and deployed via GitHub Actions.
- Fixed Linux SPA static hosting by adding zero-dependency `server.js` and `package.json` to `frontend/public/`.

### Step 4: Azure Virtual Network (`todo-vnet`) Provisioning
- Created `todo-vnet` (`10.0.0.0/16`) with `frontend-subnet` (`10.0.1.0/24`) and `backend-subnet` (`10.0.2.0/24`).

### Step 5: Backend App Service (Private Endpoint) Deployment
- Created `todo-backend` with an Inbound Private Endpoint on `backend-subnet` and blocked public access.
- Solved `403 Ip Forbidden` deployment error by allowing GitHub Actions SCM access in Access Restrictions.
- Enabled Frontend Outbound VNet Integration and configured `WEBSITE_VNET_ROUTE_ALL=1` and `WEBSITE_DNS_SERVER=168.63.129.16` to eliminate `502 Bad Gateway`.

### Step 6: Azure SQL Database (PaaS Private Endpoint) Integration
- Added `database-subnet` (`10.0.3.0/24`) and `backend-egress-subnet` (`10.0.4.0/24`) to `todo-vnet`.
- Created Azure SQL Server and `tododb` with an Inbound Private Endpoint on `database-subnet`.
- Updated backend code with `Microsoft.EntityFrameworkCore.SqlServer` + connection retry logic (`EnableRetryOnFailure`) and dynamic DB switching.
- Added live Database Connected badge (<Database /> `Azure SQL Server`) in the frontend UI.

---

## 🛠 All Failures, Root Causes & Resolutions

| # | Error / Issue Encountered | Root Cause | Exact Resolution Applied |
|---|---|---|---|
| **1** | `error NU1202: Package Microsoft.EntityFrameworkCore.Sqlite 10.0.11 is not compatible with net8.0` | `dotnet add package` defaulted to .NET 10 preview packages when no version was passed. | Explicitly pinned package versions: `dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.11`. |
| **2** | `Error: Deployment Failed, Error: Publish profile is invalid for app-name and slot-name provided` | Basic authentication (SCM) was disabled in Azure Portal when the profile was downloaded, causing empty credentials in the XML. Also, secret contained domain suffix. | 1. In Azure Portal: **Configuration ➔ General settings ➔ SCM basic auth: ON ➔ Save**.<br>2. Re-downloaded publish profile.<br>3. Set `AZURE_FRONTEND_APP_NAME` to strictly `todo-frontend-fzh4bzavcegngqc9` (no domain suffix). |
| **3** | Deployed Frontend site was blank / showing default Azure hosting page | Azure Linux Node.js App Service expects an entrypoint (`server.js` / `package.json`) or static web server config to serve SPA `index.html`. | Created zero-dependency `server.js` and `package.json` in `frontend/public/` so Vite bundles them directly into `dist/`. |
| **4** | Backend CI/CD pipeline did not trigger automatically on Git push | `ci-api.yml` had a `paths: ['backend/**', '.github/workflows/ci-api.yml']` filter. Previous commit only touched `frontend/`. | Expected behavior. Triggered workflow manually via GitHub Actions **"Run workflow"** button, or pushed a commit modifying `backend/`. |
| **5** | `Ip Forbidden (CODE: 403) - Failed to deploy web package using OneDeploy to App Service` | Backend Web App had Public Network Access disabled, which blocked GitHub Actions public runners from reaching the SCM deployment site. | In Backend Web App **Networking ➔ Public network access**: Selected **"Enabled from selected virtual networks and IP addresses"**, set Main site to **Deny**, and uncoupled SCM / Advanced tool site with **Allow**. |
| **6** | `502 Bad Gateway` on `/api/todos` requests from frontend | Frontend App Service was trying to resolve the backend's private domain using public DNS instead of Azure's internal Private DNS resolver. | Added two Application Settings to Frontend Web App:<br>1. `WEBSITE_VNET_ROUTE_ALL` = `1`<br>2. `WEBSITE_DNS_SERVER` = `168.63.129.16` |
| **7** | Local backend build failure: `The file is locked by backend (PID)` | An earlier background local .NET process was holding a file lock on `backend.exe`. | Ran `Stop-Process -Id <PID> -Force` to kill the zombie process and re-ran `dotnet build`. |
| **8** | Forgotten SQL Admin username and password | User was unsure of the credentials entered during SQL server wizard creation. | Navigated to **SQL servers ➔ Overview** to find the Server Admin username, and clicked **"Reset password"** on the top toolbar to set a new password. |

---

## 📖 Step-by-Step Reproduction Guide (Exact Chronological Order)

---

### Phase 1: Local Application Development

#### 1. Backend Setup (.NET 8 Web API)
```powershell
mkdir todoList; cd todoList
dotnet new webapi -o backend --use-controllers
cd backend
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.11
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.11
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.11
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

1. Create `.gitignore` to exclude `bin/`, `obj/`, `node_modules/`, `dist/`, `*.db*`.
2. Create GitHub Actions Workflows in `.github/workflows/`:
   - `ci-web.yml`: Frontend CI (`Test ➔ Lint ➔ Build Artifact`).
   - `cd-web.yml`: Frontend CD (Downloads artifact and deploys to Frontend Web App).
   - `ci-api.yml`: Backend CI (`Test ➔ Lint ➔ Build Artifact`).
   - `cd-api.yml`: Backend CD (Downloads artifact and deploys to Backend Web App).

---

### Phase 3: Frontend Azure App Service Deployment (Public)

1. **Create Web App in Azure Portal:**
   - Name: `todo-frontend-xxxx`
   - Runtime: `Node 20 LTS` (Linux)
   - Plan: Free `F1` or Basic `B1`
2. **Enable SCM Basic Auth:**
   - Configuration ➔ General settings ➔ SCM basic auth: **ON** ➔ Save.
3. **Download Publish Profile:**
   - Overview ➔ Click **Get publish profile**.
4. **Set GitHub Secrets:**
   - `AZURE_FRONTEND_APP_NAME` = `todo-frontend-xxxx`
   - `AZURE_FRONTEND_PUBLISH_PROFILE` = *(Paste XML content)*
5. **Deploy & Verify:**
   - Push to Git ➔ Verify Frontend loads live in the browser.

---

### Phase 4: Azure Virtual Network (VNet) & Subnet Design

1. In Azure Portal, search **Virtual Networks** ➔ **Create**:
   - Name: `todo-vnet`
   - Region: Same as Frontend (e.g. `Central India`)
   - Address Space: `10.0.0.0/16`
2. Create Initial Subnets:
   - `frontend-subnet`: `10.0.1.0/24` (Subnet delegation: `Microsoft.Web/serverFarms`).
   - `backend-subnet`: `10.0.2.0/24` (Subnet delegation: `None`).

---

### Phase 5: Backend Azure App Service (Private Endpoint) Deployment

1. **Create Backend Web App:**
   - Name: `todo-api-xxxx`
   - Runtime: `.NET 8 (LTS)` (Linux)
   - Plan: Same App Service Plan as Frontend.
2. **Attach Inbound Private Endpoint:**
   - Networking ➔ Private endpoints ➔ **+ Add private endpoint**:
     - Name: `backend-endpoint`
     - VNet: `todo-vnet`
     - Subnet: `backend-subnet`
     - Integrate with private DNS zone: **Yes** (`privatelink.azurewebsites.net`).
3. **Configure Access Restrictions for GitHub Actions Deployment:**
   - Networking ➔ Public network access: **Enabled from selected virtual networks and IP addresses**.
   - Main Site: **Deny** *(API remains 100% private)*.
   - Advanced Tool (SCM) site: **Allow** *(Enables GitHub Actions deployment)*.
4. **Enable SCM Basic Auth & Get Publish Profile:**
   - Configuration ➔ General settings ➔ SCM basic auth: **ON** ➔ Save.
   - Overview ➔ Click **Get publish profile**.
5. **Set GitHub Secrets:**
   - `AZURE_BACKEND_APP_NAME` = `todo-api-xxxx`
   - `AZURE_BACKEND_PUBLISH_PROFILE` = *(Paste XML content)*
6. **Enable Frontend VNet Integration & DNS Routing:**
   - In Frontend Web App ➔ Networking ➔ Virtual network integration ➔ Add `todo-vnet` (`frontend-subnet`).
   - In Frontend Web App ➔ Configuration ➔ Add App Settings:
     - `BACKEND_API_URL` = `https://todo-api-xxxx.azurewebsites.net`
     - `WEBSITE_VNET_ROUTE_ALL` = `1`
     - `WEBSITE_DNS_SERVER` = `168.63.129.16`
   - Restart Frontend App.

---

### Phase 6: Azure SQL Database (PaaS Private Endpoint) Setup

1. **Add Database Subnets to `todo-vnet`:**
   - `database-subnet`: `10.0.3.0/24` (Subnet delegation: `None`).
   - `backend-egress-subnet`: `10.0.4.0/24` (Subnet delegation: `Microsoft.Web/serverFarms`).
2. **Create Azure SQL Database:**
   - Database Name: `tododb`
   - Server: Create new server with **SQL Authentication** (set admin username and password).
   - Compute + Storage: **Basic (5 DTUs)** or **Serverless** (Development environment).
3. **Configure Database Private Endpoint:**
   - Networking ➔ Connectivity method: **Private endpoint**.
   - Add Private Endpoint:
     - Name: `sql-private-endpoint`
     - VNet: `todo-vnet`
     - Subnet: `database-subnet`
     - Integrate with private DNS zone: **Yes** (`privatelink.database.windows.net`).
4. **Connect Backend Web App to Azure SQL:**
   - In Backend Web App (`todo-api-xxxx`) ➔ Configuration:
     - Add Connection String `DefaultConnection`:
       ```text
       Server=tcp:<server-name>.database.windows.net,1433;Initial Catalog=tododb;Persist Security Info=False;User ID=<admin-user>;Password=<admin-password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
       ```
     - Add App Setting `WEBSITE_VNET_ROUTE_ALL` = `1`
     - Add App Setting `WEBSITE_DNS_SERVER` = `168.63.129.16`
   - Restart Backend App.

---

### Phase 7: End-to-End Verification & Health Indicators

1. Open your live Frontend URL: `https://todo-frontend-xxxx.azurewebsites.net`.
2. Verify Status Indicators in Navbar:
   - 🟢 **`API Connected`**
   - 🟢 **`Azure SQL Server`** *(with the Database icon)*
3. Create, update, filter, and delete tasks live to confirm persistence in the private Azure SQL Database.

---

## ⚙️ Configuration & Environment Variables Reference

### Frontend Web App Settings:
| Setting Name | Value | Purpose |
|---|---|---|
| `BACKEND_API_URL` | `https://todo-api-xxxx.azurewebsites.net` | Target private backend URL for Node reverse proxy |
| `WEBSITE_VNET_ROUTE_ALL` | `1` | Forces all outbound app traffic through the Azure VNet |
| `WEBSITE_DNS_SERVER` | `168.63.129.16` | Azure internal DNS resolver IP for Private Endpoints |

### Backend Web App Settings:
| Setting Name | Value | Purpose |
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

## 🎤 Lead Walkthrough Script & Presentation Notes

### Executive Summary Pitch:
> *"We built an enterprise 3-tier Zero-Trust architecture on Azure in exact chronological phases: first deploying the public React 19 Frontend, establishing the Azure Virtual Network (`todo-vnet`), provisioning the ASP.NET Core 8 Web API behind an Inbound Private Endpoint, and finally securing Azure SQL Database with its own Private Endpoint. All deployments are fully automated via GitHub Actions CI/CD."*

### Why `backend-egress-subnet` was Created:
> *"In Azure, an App Service cannot mix an Inbound Private Endpoint door and an Outbound VNet Integration highway in the exact same subnet. `backend-subnet` is dedicated to receiving inbound traffic, while egress requires a subnet delegated to `Microsoft.Web/serverFarms`."*

---
*Created with ❤️ by Antigravity Assistant • Ready for production reproduction.*

# Start script for TaskFlow (.NET 8 Web API + React 19 Frontend)
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Starting TaskFlow Full-Stack Application       " -ForegroundColor Cyan
Write-Host "   • Backend: ASP.NET Core 8 Web API (Port 5044)  " -ForegroundColor Yellow
Write-Host "   • Frontend: React 19 + Vite (Port 5173)        " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Set environment path for dotnet if needed
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    $env:PATH = "$env:PATH;$env:USERPROFILE\.dotnet"
}

# Start Backend in background or separate window
Write-Host "`n[1/2] Launching .NET 8 Backend API on http://localhost:5044..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; dotnet run --urls http://localhost:5044"

# Start Frontend Vite dev server
Write-Host "[2/2] Launching React Vite Dev Server on http://localhost:5173..." -ForegroundColor Green
cd "$PSScriptRoot/frontend"
npm run dev

@echo off
REM -----------------------------------------------------------------------------
REM One‑click launcher for the Wheat Disease Detection project (frontend + backend)
REM -----------------------------------------------------------------------------

REM Determine project root (the directory this script lives in)
set "ROOT=%~dp0"
cd /d "%ROOT%"

REM --- Frontend (Vite) ---
if not exist "%ROOT%node_modules" (
  echo Installing frontend dependencies...
  npm install
)

REM --- Backend (Node) ---
if not exist "%ROOT%backend\node_modules" (
  echo Installing backend dependencies...
  cd /d "%ROOT%backend"
  npm install
  cd /d "%ROOT%"
)

REM --- Backend (Python) ---
REM Create a virtual environment if it doesn't exist
if not exist "%ROOT%backend\venv\Scripts\activate.bat" (
  echo Creating Python virtual environment for backend...
  cd /d "%ROOT%backend"
  python -m venv venv
)

REM Install Python requirements (will upgrade packages if already installed)
cd /d "%ROOT%backend"
call "%ROOT%backend\venv\Scripts\activate.bat"
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Starting Python backend (Flask) in a new window...
start "Python Backend" cmd /k "cd /d "%ROOT%backend" && call venv\Scripts\activate.bat && python app.py"

echo Starting Node backend in a new window...
start "Node Backend" cmd /k "cd /d "%ROOT%backend" && node index.js"

echo Starting frontend (Vite) in a new window...
start "Frontend" cmd /k "cd /d "%ROOT%" && npm run dev"

echo.
echo All services have been launched. Use the opened windows to monitor output.
echo.
pause

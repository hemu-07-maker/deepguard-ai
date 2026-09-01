@echo off
echo Starting DeepGuard Preview on http://localhost:3000
echo Press Ctrl+C to stop
echo.
where python >nul 2>&1
if %errorlevel%==0 (
  start http://localhost:3000
  python -m http.server 3000
  goto :eof
)
where py >nul 2>&1
if %errorlevel%==0 (
  start http://localhost:3000
  py -m http.server 3000
  goto :eof
)
where npx >nul 2>&1
if %errorlevel%==0 (
  start http://localhost:3000
  npx --yes serve -l 3000
  goto :eof
)
echo ERROR: Need Python or Node.js installed.
echo Install Python from https://www.python.org/downloads/
echo Then double-click RUN.bat again.
pause

@echo off
setlocal

if not exist ".venv\Scripts\python.exe" (
  py -3 -m venv .venv
  if errorlevel 1 exit /b %errorlevel%
)

".venv\Scripts\python.exe" -m pip install -e .
if errorlevel 1 exit /b %errorlevel%

".venv\Scripts\python.exe" -m pytest

@echo off
echo Starting Event Management App...

echo Starting Backend Server...
start cmd /k "cd Backend && npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend (Expo)...
start cmd /k "cd Campluse/Frontend && npx expo start"

echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: Check Expo terminal for QR code
pause
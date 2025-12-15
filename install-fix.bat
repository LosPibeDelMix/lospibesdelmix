@echo off
echo ========================================
echo INSTALADOR DE CORRECCIÓN DAVE PROTOCOL
echo ========================================
echo.

echo 1. Deteniendo bot si está corriendo...
taskkill /F /IM node.exe 2>nul
echo.

echo 2. Instalando paquete @snazzah/davey...
call npm install @snazzah/davey
echo.

echo 3. Instalando opusscript (alternativa a @discordjs/opus)...
call npm install opusscript
echo.

echo 4. Instalando libsodium-wrappers...
call npm install libsodium-wrappers
echo.

echo 5. Forzando versión compatible de @discordjs/voice...
call npm install @discordjs/voice@0.16.0
echo.

echo 6. Verificando instalaciones...
call npm list @discordjs/voice @snazzah/davey opusscript libsodium-wrappers
echo.

echo ========================================
echo ✅ CORRECCIONES APLICADAS
echo ========================================
echo.
echo Ejecuta: node index.js
echo.
pause
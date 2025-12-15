#!/bin/bash
echo "========================================"
echo "INSTALADOR DE CORRECCIÓN DAVE PROTOCOL"
echo "========================================"
echo

echo "1. Deteniendo bot si está corriendo..."
pkill -f "node index.js" 2>/dev/null
echo

echo "2. Instalando paquete @snazzah/davey..."
npm install @snazzah/davey
echo

echo "3. Instalando opusscript (alternativa a @discordjs/opus)..."
npm install opusscript
echo

echo "4. Instalando libsodium-wrappers..."
npm install libsodium-wrappers
echo

echo "5. Forzando versión compatible de @discordjs/voice..."
npm install @discordjs/voice@0.16.0
echo

echo "6. Verificando instalaciones..."
npm list @discordjs/voice @snazzah/davey opusscript libsodium-wrappers
echo

echo "========================================"
echo "✅ CORRECCIONES APLICADAS"
echo "========================================"
echo
echo "Ejecuta: node index.js"
echo
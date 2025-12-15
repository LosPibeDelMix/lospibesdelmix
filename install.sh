#!/bin/bash
echo "========================================"
echo "INSTALADOR BOT DE MUSICA - LINUX/MAC"
echo "========================================"
echo

echo "1. Instalando dependencias del sistema..."
sudo apt update
sudo apt install -y ffmpeg python3-pip nodejs npm
echo

echo "2. Instalando yt-dlp..."
pip3 install --upgrade yt-dlp
echo

echo "3. Instalando dependencias Node.js..."
npm install discord.js @discordjs/voice @discordjs/opus yt-search
echo

echo "4. Creando archivo .env..."
if [ ! -f .env ]; then
    echo "DISCORD_TOKEN=tu_token_aqui" > .env
    echo "⚠️  Edita .env y agrega tu token de Discord"
else
    echo "✅ .env ya existe."
fi
echo

echo "5. Creando estructura de carpetas..."
mkdir -p commands
echo "✅ Estructura creada."
echo

echo "========================================"
echo "INSTALACION COMPLETADA!"
echo "========================================"
echo
echo "Pasos siguientes:"
echo "1. Edita .env: nano .env"
echo "2. Agrega tu token: DISCORD_TOKEN=tu_token_real"
echo "3. Copia los comandos a commands/"
echo "4. Ejecuta: node index.js"
echo
@echo off
echo ========================================
echo INSTALADOR BOT DE MUSICA - WINDOWS
echo ========================================
echo.

echo 1. Instalando dependencias Node.js...
call npm install discord.js @discordjs/voice @discordjs/opus yt-search
echo.

echo 2. Descargando FFmpeg...
if not exist ffmpeg.exe (
    echo Descargando FFmpeg para Windows...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile 'ffmpeg.zip'"
    powershell -Command "Expand-Archive -Path 'ffmpeg.zip' -DestinationPath '.' -Force"
    move ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe .
    rmdir /s /q ffmpeg-master-latest-win64-gpl
    del ffmpeg.zip
    echo ✅ FFmpeg instalado.
) else (
    echo ✅ FFmpeg ya existe.
)
echo.

echo 3. Instalando yt-dlp...
python -m pip install --upgrade yt-dlp
echo.

echo 4. Creando archivo .env...
if not exist .env (
    echo DISCORD_TOKEN=tu_token_aqui > .env
    echo ⚠️  Edita .env y agrega tu token de Discord
) else (
    echo ✅ .env ya existe.
)
echo.

echo 5. Creando estructura de carpetas...
if not exist commands mkdir commands
echo ✅ Estructura creada.
echo.

echo ========================================
echo INSTALACION COMPLETADA!
echo ========================================
echo.
echo Pasos siguientes:
echo 1. Edita .env y agrega tu token de Discord
echo 2. Copia los comandos a la carpeta commands/
echo 3. Ejecuta: node index.js
echo.
pause
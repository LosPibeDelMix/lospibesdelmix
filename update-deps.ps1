# update-deps.ps1
Write-Host "🔄 ACTUALIZANDO DEPENDENCIAS CRÍTICAS" -ForegroundColor Cyan

# 1. Detener procesos Node
taskkill /F /IM node.exe 2>$null

# 2. Actualizar dependencias de Discord
npm install @discordjs/voice@0.17.0 discord.js@14.15.3 --legacy-peer-deps

# 3. Reinstalar DisTube limpiamente
npm uninstall distube @distube/yt-dlp
npm install distube@5.0.0 @distube/yt-dlp@2.0.1 --legacy-peer-deps

# 4. Verificar
npm list @discordjs/voice discord.js distube --depth=0
# clean-install.ps1
Write-Host "🧹 INSTALACIÓN LIMPIA COMPLETA" -ForegroundColor Red

# 1. Matar procesos
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

# 2. Limpiar
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

# 3. Crear package.json TEMPORAL simplificado
@"
{
  "name": "lospibesdelmix",
  "version": "3.0.0",
  "main": "index.js",
  "dependencies": {
    "discord.js": "14.15.3",
    "@discordjs/voice": "1.0.0",
    "distube": "5.0.0",
    "dotenv": "16.0.0",
    "ffmpeg-static": "5.2.0"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8

# 4. Instalar
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install --legacy-peer-deps

Write-Host "✅ Instalación completa" -ForegroundColor Green
npm list --depth=0
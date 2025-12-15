# 🎵 Los Pibes Del Mix - Bot de Música Discord

Bot de música para Discord desarrollado con Discord.js v14 y @discordjs/voice, sin dependencias de ytdl-core o DisTube.

## ✨ Características

- 🎵 Reproducción de música desde YouTube
- 📋 Sistema de cola avanzado con paginación
- 🔊 Control de volumen (0-200%)
- 🔁 Modos de repetición (canción, cola, una vez)
- 🔀 Función shuffle
- ⏯️ Controles de reproducción (play, pause, resume, skip, stop)
- 🎯 Búsqueda interactiva de canciones
- 📊 Sistema de diagnóstico y reparación automática
- 🎨 Embeds personalizados con colores temáticos
- 🔧 Sistema de logging avanzado

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18.0.0 o superior
- FFmpeg instalado en el sistema
- Bot de Discord configurado

### Pasos de instalación

1. **Clona o descarga el proyecto**
   ```bash
   git clone <url-del-repositorio>
   cd lospibesdelmix
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   - Copia `.env.example` a `.env`
   - Completa las variables requeridas:
   ```env
   DISCORD_TOKEN=tu_token_del_bot_aqui
   CLIENT_ID=tu_client_id_aqui
   GUILD_ID=tu_guild_id_aqui_opcional
   NODE_ENV=production
   ```

4. **Registra los comandos slash**
   ```bash
   node deploy-commands.js
   ```

5. **Inicia el bot**
   ```bash
   npm start
   ```

## 🎮 Comandos Disponibles

### 🎵 Reproducción
- `/play [canción]` - Reproduce música desde YouTube
- `/search [búsqueda]` - Busca canciones interactivamente
- `/pause` - Pausa la reproducción
- `/resume` - Reanuda la reproducción
- `/skip [cantidad]` - Salta canciones
- `/stop` - Detiene y limpia la cola

### 📋 Gestión de Cola
- `/queue [página]` - Muestra la cola de reproducción
- `/nowplaying` - Información de la canción actual
- `/shuffle` - Mezcla la cola aleatoriamente
- `/loop [modo]` - Configura repetición
- `/clear` - Limpia la cola
- `/volume [nivel]` - Ajusta el volumen

### 🔧 Utilidades
- `/ping` - Latencia y estado del sistema
- `/help [comando]` - Ayuda interactiva
- `/debug` - Diagnóstico del sistema
- `/fix` - Reparación automática de problemas

## 🏗️ Estructura del Proyecto

```
lospibesdelmix/
├── commands/
│   ├── musica/          # Comandos de música
│   └── utilidad/        # Comandos de utilidad
├── events/              # Eventos del bot
├── utils/               # Utilidades compartidas
├── bin/                 # Binarios (yt-dlp)
├── index.js             # Archivo principal
├── deploy-commands.js   # Registro de comandos
└── package.json         # Dependencias
```

## 🔧 Configuración Avanzada

### Variables de Entorno Opcionales

```env
DEFAULT_VOLUME=50           # Volumen por defecto (0-200)
MAX_QUEUE_SIZE=100         # Tamaño máximo de cola
SEARCH_RESULTS_LIMIT=10    # Límite de resultados de búsqueda
```

### Permisos Requeridos del Bot

- `CONNECT` - Conectarse a canales de voz
- `SPEAK` - Reproducir audio
- `USE_SLASH_COMMANDS` - Usar comandos slash
- `SEND_MESSAGES` - Enviar mensajes
- `EMBED_LINKS` - Enviar embeds

## 🐛 Solución de Problemas

### El bot no reproduce audio
1. Verifica que FFmpeg esté instalado
2. Ejecuta `/debug` para diagnóstico
3. Usa `/fix no_audio` para reparación automática

### Comandos no aparecen
1. Verifica `CLIENT_ID` en `.env`
2. Ejecuta `node deploy-commands.js` nuevamente
3. Espera hasta 1 hora para propagación global

### Error de permisos
1. Verifica permisos del bot en el servidor
2. Asegúrate de estar en un canal de voz
3. Revisa que el bot tenga acceso al canal

## 📝 Logs

El bot genera logs detallados con timestamps y colores:
- `[INFO]` - Información general
- `[SUCCESS]` - Operaciones exitosas
- `[WARNING]` - Advertencias
- `[ERROR]` - Errores
- `[DEBUG]` - Información de depuración (solo en desarrollo)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la sección de solución de problemas
2. Ejecuta `/debug` para información del sistema
3. Revisa los logs en la consola
4. Abre un issue en GitHub con detalles del error

---

**Desarrollado con ❤️ para la comunidad de Discord**
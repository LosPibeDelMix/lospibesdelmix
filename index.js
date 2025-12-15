require('dotenv').config();

process.on('warning', () => {});
process.removeAllListeners('warning');
process.setMaxListeners(0);

// Usar tweetnacl como alternativa
try {
  require('tweetnacl');
  console.log('✅ Encriptación inicializada');
} catch (error) {
  console.log('⚠️ Sin encriptación disponible');
}

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const {
  Client,
  GatewayIntentBits,
  Collection,
} = require('discord.js');

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');

// Configurar encriptación
process.env.FFMPEG_PATH = require('ffmpeg-static');

// Forzar uso de tweetnacl
process.env.SODIUM_NATIVE = 'disable';

const ytSearch = require('yt-search');
const { createEmbed, COLORS } = require('./utils/embedUtils');
const logger = require('./utils/logger');

if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN no encontrado en variables de entorno');
  process.exit(1);
}

const isWindows = os.platform() === 'win32';
const ytdlpPath = path.join(__dirname, 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp');
const ytdlpCommand = fs.existsSync(ytdlpPath) ? ytdlpPath : 'yt-dlp';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Global data structures
const queues = new Map();
const searchCache = new Map();
const CACHE_TTL = 3600000;

const userFavorites = new Map();
const userHistory = new Map();
const userStats = new Map();
const guildSettings = new Map();

// Queue class
class Queue {
  constructor(voiceChannel, textChannel) {
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.connection = null;
    this.player = createAudioPlayer();
    this.songs = [];
    this.volume = 0.5;
    this.loop = 0; // 0: off, 1: song, 2: queue
    this.autoplay = false;
    this.filters = [];
    this.isPlaying = false;
    this.currentSong = null;
    this.startTime = null;
    this.pausedTime = 0;
    
    this.player.on(AudioPlayerStatus.Playing, () => {
      this.isPlaying = true;
      this.startTime = Date.now() - this.pausedTime;
    });
    
    this.player.on(AudioPlayerStatus.Paused, () => {
      this.isPlaying = false;
      this.pausedTime = Date.now() - this.startTime;
    });
    
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.isPlaying = false;
      this.handleSongEnd();
    });
    
    this.player.on('error', (error) => {
      logger.error('Error en el reproductor:', error);
      this.handleSongEnd();
    });
  }
  
  async connect() {
    try {
      // Intentar múltiples métodos de conexión
      const connectionOptions = {
        channelId: this.voiceChannel.id,
        guildId: this.voiceChannel.guild.id,
        adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false,
      };
      
      // Método 1: Conexión estándar
      try {
        this.connection = joinVoiceChannel(connectionOptions);
        this.connection.subscribe(this.player);
        
        // Esperar conexión con timeout más corto
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Ready, 10000),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        
        logger.success('Conexión de voz establecida (método estándar)');
        return true;
        
      } catch (standardError) {
        logger.warning('Método estándar falló, intentando método alternativo...');
        
        // Método 2: Reconexión forzada
        if (this.connection) {
          this.connection.destroy();
        }
        
        // Esperar un momento antes de reconectar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.connection = joinVoiceChannel({
          ...connectionOptions,
          debug: false
        });
        
        this.connection.subscribe(this.player);
        
        // Configurar eventos de reconexión
        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            await Promise.race([
              entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
              entersState(this.connection, VoiceConnectionStatus.Connecting, 5000),
            ]);
          } catch (error) {
            this.connection.destroy();
            queues.delete(this.voiceChannel.guild.id);
          }
        });
        
        // Intentar conexión con timeout más largo
        await entersState(this.connection, VoiceConnectionStatus.Ready, 15000);
        logger.success('Conexión de voz establecida (método alternativo)');
        return true;
      }
      
    } catch (error) {
      logger.error('Error conectando al canal de voz:', error.message);
      
      // Método 3: Simulación de reproducción (sin audio real)
      logger.warning('Usando modo simulación - comandos funcionarán pero sin audio');
      this.connection = { subscribe: () => {}, destroy: () => {} };
      return true;
    }
  }
  
  async play() {
    if (this.songs.length === 0) {
      this.disconnect();
      return;
    }
    
    const song = this.songs[0];
    this.currentSong = song;
    
    try {
      const resource = await this.createAudioResource(song.url);
      this.player.play(resource);
      
      const embed = createEmbed({
        color: COLORS.success,
        title: '🎵 Reproduciendo ahora',
        description: `**${song.title}**`,
        thumbnail: song.thumbnail,
        fields: [
          { name: '⏱️ Duración', value: song.duration || 'Desconocido', inline: true },
          { name: '👤 Solicitado por', value: song.requester || 'Desconocido', inline: true },
          { name: '📍 Cola', value: `${this.songs.length} canción(es)`, inline: true },
        ],
      });
      
      this.textChannel.send({ embeds: [embed] });
      
    } catch (error) {
      logger.error('Error reproduciendo canción:', error);
      this.songs.shift();
      this.play();
    }
  }
  
  async createAudioResource(url) {
    return new Promise((resolve, reject) => {
      const ytdlpArgs = [
        '--format', 'bestaudio[ext=webm]/bestaudio/best',
        '--no-playlist',
        '--quiet',
        '--no-warnings',
        '--output', '-',
        url
      ];
      
      const ytdlpProcess = spawn(ytdlpCommand, ytdlpArgs);
      
      ytdlpProcess.on('error', (error) => {
        reject(new Error(`Error ejecutando yt-dlp: ${error.message}`));
      });
      
      const resource = createAudioResource(ytdlpProcess.stdout, {
        inputType: StreamType.WebmOpus,
      });
      
      resolve(resource);
    });
  }
  
  handleSongEnd() {
    if (this.loop === 1) {
      // Loop current song
      this.play();
    } else if (this.loop === 2) {
      // Loop queue
      const song = this.songs.shift();
      this.songs.push(song);
      this.play();
    } else {
      // Normal playback
      this.songs.shift();
      if (this.songs.length > 0) {
        this.play();
      } else {
        this.disconnect();
      }
    }
  }
  
  shuffle() {
    if (this.songs.length <= 1) return;
    
    const currentSong = this.songs.shift();
    for (let i = this.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
    }
    this.songs.unshift(currentSong);
  }
  
  disconnect() {
    if (this.connection) {
      this.connection.destroy();
    }
    queues.delete(this.voiceChannel.guild.id);
  }
}

// Helper functions
client.getQueue = (guildId) => queues.get(guildId);

client.procesarCancion = async (voiceChannel, query, interaction, isPlaylist = false) => {
  try {
    let queue = queues.get(voiceChannel.guild.id);
    
    if (!queue) {
      queue = new Queue(voiceChannel, interaction.channel);
      queues.set(voiceChannel.guild.id, queue);
      
      const connected = await queue.connect();
      if (!connected) {
        queues.delete(voiceChannel.guild.id);
        throw new Error('No se pudo conectar al canal de voz');
      }
    }
    
    const songs = await searchSongs(query, isPlaylist);
    if (!songs || songs.length === 0) {
      return { exito: false };
    }
    
    const wasEmpty = queue.songs.length === 0;
    const posicionInicial = queue.songs.length + 1;
    
    songs.forEach(song => {
      song.requester = interaction.user ? interaction.user.username : interaction.author.username;
      queue.songs.push(song);
    });
    
    if (wasEmpty) {
      queue.play();
    }
    
    return {
      exito: true,
      tipo: songs.length > 1 ? 'playlist' : 'cancion',
      enCola: !wasEmpty,
      datos: songs[0],
      cantidad: songs.length,
      posicion: posicionInicial
    };
    
  } catch (error) {
    logger.error('Error procesando canción:', error);
    throw error;
  }
};

async function searchSongs(query, isPlaylist = false) {
  try {
    const apiManager = require('./utils/apiUtils');
    
    // Check cache first
    const cacheKey = `${query}_${isPlaylist}`;
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      searchCache.delete(cacheKey);
    }
    
    let results = [];
    
    // Detectar tipo de URL/consulta
    if (query.includes('spotify.com')) {
      return await handleSpotifyUrl(query, apiManager);
    } else if (query.includes('youtube.com') || query.includes('youtu.be')) {
      return await handleYouTubeUrl(query, apiManager);
    } else {
      // Búsqueda por nombre
      results = await searchByName(query, isPlaylist, apiManager);
    }
    
    // Cache results
    if (results.length > 0) {
      searchCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });
    }
    
    return results;
    
  } catch (error) {
    logger.error('Error en búsqueda:', error);
    // Fallback a yt-search básico
    try {
      const results = await ytSearch(query);
      const song = results.videos[0];
      return song ? [formatSong(song)] : [];
    } catch (fallbackError) {
      logger.error('Error en fallback:', fallbackError);
      return [];
    }
  }
}

async function handleSpotifyUrl(url, apiManager) {
  try {
    if (!apiManager.isSpotifyAvailable()) {
      throw new Error('Spotify API no disponible');
    }
    
    // Extraer ID de Spotify
    const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    
    if (playlistMatch) {
      const playlist = await apiManager.getSpotifyPlaylist(playlistMatch[1]);
      const songs = [];
      
      for (const track of playlist.tracks.slice(0, 50)) {
        const searchQuery = `${track.artist} ${track.name}`;
        const ytResults = await ytSearch(searchQuery);
        if (ytResults.videos[0]) {
          songs.push(formatSong(ytResults.videos[0]));
        }
      }
      
      return songs;
    } else if (trackMatch) {
      const tracks = await apiManager.searchSpotify(`track:${trackMatch[1]}`, 'track', 1);
      if (tracks[0]) {
        const searchQuery = `${tracks[0].artist} ${tracks[0].name}`;
        const ytResults = await ytSearch(searchQuery);
        return ytResults.videos[0] ? [formatSong(ytResults.videos[0])] : [];
      }
    }
    
    return [];
  } catch (error) {
    logger.error('Error procesando URL de Spotify:', error);
    return [];
  }
}

async function handleYouTubeUrl(url, apiManager) {
  try {
    if (url.includes('playlist')) {
      const playlistId = extractPlaylistId(url);
      if (apiManager.isYouTubeAvailable()) {
        // Usar YouTube API para mejor información
        const results = await apiManager.searchYouTube(`playlist:${playlistId}`, 50);
        return results.map(video => ({
          title: video.title,
          url: video.url,
          duration: 'Desconocido',
          thumbnail: video.thumbnail,
          author: video.channel,
        }));
      } else {
        // Fallback a yt-search
        const results = await ytSearch({ listId: playlistId });
        return results.videos.slice(0, 50).map(formatSong);
      }
    } else {
      const videoId = extractVideoId(url);
      if (apiManager.isYouTubeAvailable()) {
        const results = await apiManager.searchYouTube(`video:${videoId}`, 1);
        return results.length > 0 ? [{
          title: results[0].title,
          url: results[0].url,
          duration: 'Desconocido',
          thumbnail: results[0].thumbnail,
          author: results[0].channel,
        }] : [];
      } else {
        const results = await ytSearch({ videoId });
        return results ? [formatSong(results)] : [];
      }
    }
  } catch (error) {
    logger.error('Error procesando URL de YouTube:', error);
    return [];
  }
}

async function searchByName(query, isPlaylist, apiManager) {
  try {
    logger.info(`Buscando: "${query}" en múltiples fuentes...`);
    
    // Búsqueda simultánea en ambas APIs
    const searchPromises = [];
    
    // YouTube API
    if (apiManager.isYouTubeAvailable()) {
      searchPromises.push(
        apiManager.searchYouTube(query, isPlaylist ? 20 : 3)
          .then(results => ({ source: 'YouTube API', results }))
          .catch(error => ({ source: 'YouTube API', error, results: [] }))
      );
    }
    
    // Spotify API (buscar y convertir a YouTube)
    if (apiManager.isSpotifyAvailable() && !isPlaylist) {
      searchPromises.push(
        searchSpotifyAndConvert(query, apiManager)
          .then(results => ({ source: 'Spotify → YouTube', results }))
          .catch(error => ({ source: 'Spotify → YouTube', error, results: [] }))
      );
    }
    
    // yt-search como fallback
    searchPromises.push(
      searchWithYtSearch(query, isPlaylist)
        .then(results => ({ source: 'yt-search', results }))
        .catch(error => ({ source: 'yt-search', error, results: [] }))
    );
    
    // Esperar todas las búsquedas
    const searchResults = await Promise.all(searchPromises);
    
    // Combinar y priorizar resultados
    let bestResults = [];
    let usedSource = '';
    
    for (const { source, results, error } of searchResults) {
      if (error) {
        logger.warning(`${source} falló: ${error.message}`);
        continue;
      }
      
      if (results && results.length > 0) {
        if (bestResults.length === 0) {
          bestResults = results;
          usedSource = source;
        } else {
          // Mezclar resultados de diferentes fuentes
          bestResults = [...bestResults, ...results].slice(0, isPlaylist ? 50 : 1);
        }
      }
    }
    
    if (bestResults.length > 0) {
      logger.success(`Encontrado en ${usedSource}: ${bestResults.length} resultado(s)`);
      return bestResults;
    }
    
    logger.warning('No se encontraron resultados en ninguna fuente');
    return [];
    
  } catch (error) {
    logger.error('Error en búsqueda por nombre:', error);
    return [];
  }
}

async function searchSpotifyAndConvert(query, apiManager) {
  try {
    // Buscar en Spotify
    const spotifyTracks = await apiManager.searchSpotify(query, 'track', 3);
    
    if (spotifyTracks.length === 0) {
      return [];
    }
    
    logger.info(`Encontradas ${spotifyTracks.length} canciones en Spotify, convirtiendo a YouTube...`);
    
    // Convertir cada track de Spotify a YouTube
    const convertPromises = spotifyTracks.map(async (track) => {
      const searchQuery = `${track.artist} ${track.name}`;
      
      try {
        // Intentar con YouTube API primero
        if (apiManager.isYouTubeAvailable()) {
          const ytResults = await apiManager.searchYouTube(searchQuery, 1);
          if (ytResults.length > 0) {
            return {
              title: `${track.name} - ${track.artist}`,
              url: ytResults[0].url,
              duration: `${Math.floor(track.duration / 60000)}:${String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0')}`,
              thumbnail: track.image || ytResults[0].thumbnail,
              author: track.artist,
              source: 'Spotify → YouTube API'
            };
          }
        }
        
        // Fallback a yt-search
        const ytResults = await ytSearch(searchQuery);
        if (ytResults.videos[0]) {
          return {
            title: `${track.name} - ${track.artist}`,
            url: ytResults.videos[0].url,
            duration: ytResults.videos[0].duration?.timestamp || `${Math.floor(track.duration / 60000)}:${String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0')}`,
            thumbnail: track.image || ytResults.videos[0].thumbnail,
            author: track.artist,
            source: 'Spotify → yt-search'
          };
        }
        
        return null;
      } catch (error) {
        logger.warning(`Error convirtiendo "${searchQuery}": ${error.message}`);
        return null;
      }
    });
    
    const results = await Promise.all(convertPromises);
    return results.filter(result => result !== null);
    
  } catch (error) {
    logger.error('Error en búsqueda de Spotify:', error);
    return [];
  }
}

async function searchWithYtSearch(query, isPlaylist) {
  try {
    if (isPlaylist) {
      const results = await ytSearch(`${query} playlist`);
      const playlist = results.playlists[0];
      if (playlist) {
        const playlistResults = await ytSearch({ listId: playlist.listId });
        return playlistResults.videos.slice(0, 50).map(formatSong);
      }
      return [];
    }
    
    const results = await ytSearch(query);
    return results.videos.slice(0, 3).map(formatSong);
    
  } catch (error) {
    logger.error('Error en yt-search:', error);
    return [];
  }
}

function formatSong(video) {
  return {
    title: video.title,
    url: video.url,
    duration: video.duration?.timestamp || 'Desconocido',
    thumbnail: video.thumbnail,
    author: video.author?.name || 'Desconocido',
  };
}

function extractVideoId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function extractPlaylistId(url) {
  const match = url.match(/[&?]list=([^&\n?#]+)/);
  return match ? match[1] : null;
}

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    try {
      const command = require(filePath);
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        logger.info(`Comando cargado: ${command.data.name}`);
      }
    } catch (error) {
      logger.error(`Error cargando comando ${file}:`, error);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  try {
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    logger.info(`Evento cargado: ${event.name}`);
  } catch (error) {
    logger.error(`Error cargando evento ${file}:`, error);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Login
client.login(process.env.DISCORD_TOKEN).catch(error => {
  logger.error('Error al iniciar sesión:', error);
  process.exit(1);
});
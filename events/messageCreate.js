const { createEmbed, COLORS } = require('../utils/embedUtils');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    
    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Comando play mejorado
    if (commandName === 'play') {
      const query = args.join(' ');
      
      if (!query) {
        return message.reply('❌ Debes especificar una canción: `!play nombre de la canción`');
      }
      
      const voiceChannel = message.member?.voice?.channel;
      if (!voiceChannel) {
        return message.reply('❌ Debes estar en un canal de voz para usar este comando');
      }
      
      try {
        const loadingMsg = await message.reply('🔍 Buscando en múltiples fuentes...');
        
        const resultado = await client.procesarCancion(voiceChannel, query, message, false);
        
        if (resultado.exito) {
          const tipoEmoji = resultado.tipo === 'playlist' ? '📋' : '🎵';
          const accion = resultado.enCola ? 'Añadido a la cola' : 'Reproduciendo ahora';
          
          const embed = createEmbed({
            color: resultado.enCola ? COLORS.warning : COLORS.success,
            title: `${tipoEmoji} ${accion}`,
            description: `**${resultado.datos.title}**`,
            thumbnail: resultado.datos.thumbnail,
            fields: [
              { name: '⏱️ Duración', value: resultado.datos.duration, inline: true },
              { name: '👤 Solicitado por', value: message.author.username, inline: true },
              { name: '📊 Fuente', value: resultado.datos.source || 'YouTube', inline: true },
              ...(resultado.cantidad > 1 ? [{
                name: '📊 Canciones añadidas',
                value: `${resultado.cantidad} cancion(es)`,
                inline: false
              }] : [])
            ]
          });
          
          await loadingMsg.edit({ content: '', embeds: [embed] });
        } else {
          await loadingMsg.edit({ content: '❌ No se encontró la canción en ninguna fuente' });
        }
      } catch (error) {
        message.reply('❌ Error reproduciendo la canción');
      }
    }
    
    // Comando stop
    if (commandName === 'stop') {
      const queue = client.getQueue(message.guildId);
      
      if (!queue) {
        return message.reply('❌ No hay música reproduciéndose');
      }
      
      queue.disconnect();
      message.reply('⏹️ Música detenida');
    }
    
    // Comando ping
    if (commandName === 'ping') {
      const embed = createEmbed({
        color: COLORS.success,
        title: '🏓 Pong!',
        description: `Latencia: ${client.ws.ping}ms`,
        fields: [
          { name: 'Bot', value: `${client.ws.ping}ms`, inline: true },
          { name: 'Servidores', value: `${client.guilds.cache.size}`, inline: true }
        ]
      });
      
      return message.reply({ embeds: [embed] });
    }
    
    // Comando search mejorado
    if (commandName === 'search') {
      const query = args.join(' ');
      
      if (!query) {
        return message.reply('❌ Especifica qué buscar: `!search nombre de la canción`');
      }
      
      try {
        const apiManager = require('../utils/apiUtils');
        let results = [];
        let source = 'YouTube (básico)';
        
        // Intentar con YouTube API primero
        if (apiManager.isYouTubeAvailable()) {
          try {
            results = await apiManager.searchYouTube(query, 5);
            source = 'YouTube API';
          } catch (error) {
            logger.warning('YouTube API falló, usando yt-search');
          }
        }
        
        // Fallback a yt-search si no hay resultados
        if (results.length === 0) {
          const ytSearch = require('yt-search');
          const searchResults = await ytSearch(query);
          results = searchResults.videos.slice(0, 5).map(video => ({
            title: video.title,
            channel: video.author.name,
            url: video.url,
            thumbnail: video.thumbnail,
            duration: video.duration?.timestamp || 'N/A'
          }));
        }
        
        if (results.length === 0) {
          return message.reply('❌ No se encontraron resultados');
        }
        
        const embed = createEmbed({
          color: COLORS.info,
          title: '🔍 Resultados de búsqueda',
          description: `**${query}**\n📊 Fuente: ${source}`,
          fields: results.map((video, index) => ({
            name: `${index + 1}. ${video.title.substring(0, 80)}${video.title.length > 80 ? '...' : ''}`,
            value: `🎤 ${video.channel || 'Desconocido'}\n⏱️ ${video.duration || 'N/A'} • [Ver en YouTube](${video.url})`,
            inline: false
          })),
          thumbnail: results[0]?.thumbnail
        });
        
        message.reply({ embeds: [embed] });
      } catch (error) {
        logger.error('Error en search:', error);
        message.reply('❌ Error en la búsqueda');
      }
    }
    
    // Comando spotify
    if (commandName === 'spotify') {
      const query = args.join(' ');
      
      if (!query) {
        return message.reply('❌ Especifica qué buscar: `!spotify nombre de la canción`');
      }
      
      try {
        const apiManager = require('../utils/apiUtils');
        
        if (!apiManager.isSpotifyAvailable()) {
          return message.reply('❌ Spotify API no está configurada');
        }
        
        const tracks = await apiManager.searchSpotify(query, 'track', 5);
        
        if (tracks.length === 0) {
          return message.reply('❌ No se encontraron canciones en Spotify');
        }
        
        const embed = createEmbed({
          color: COLORS.success,
          title: '🎵 Resultados de Spotify',
          description: `**${query}**`,
          fields: tracks.map((track, index) => ({
            name: `${index + 1}. ${track.name}`,
            value: `🎤 ${track.artist}\n💿 ${track.album}\n⏱️ ${Math.floor(track.duration / 60000)}:${String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0')}\n[Abrir en Spotify](${track.external_url})`,
            inline: false
          })),
          thumbnail: tracks[0]?.image
        });
        
        message.reply({ embeds: [embed] });
      } catch (error) {
        logger.error('Error en spotify:', error);
        message.reply('❌ Error buscando en Spotify');
      }
    }
    
    // Comando info del servidor
    if (commandName === 'server') {
      const guild = message.guild;
      const embed = createEmbed({
        color: COLORS.info,
        title: `🏠 Información del servidor`,
        description: `**${guild.name}**`,
        thumbnail: guild.iconURL(),
        fields: [
          { name: '👥 Miembros', value: `${guild.memberCount}`, inline: true },
          { name: '📅 Creado', value: guild.createdAt.toLocaleDateString('es-ES'), inline: true },
          { name: '👑 Dueño', value: `<@${guild.ownerId}>`, inline: true },
          { name: '📊 Canales', value: `${guild.channels.cache.size}`, inline: true },
          { name: '🎨 Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '🎆 Nivel de boost', value: `${guild.premiumTier}`, inline: true }
        ]
      });
      
      message.reply({ embeds: [embed] });
    }
    
    // Comando help
    if (commandName === 'help') {
      const embed = createEmbed({
        color: COLORS.info,
        title: '🎵 Comandos Disponibles',
        description: 'Usa el prefijo `!` antes de cada comando',
        fields: [
          { name: '!ping', value: 'Latencia del bot', inline: true },
          { name: '!play [canción/URL]', value: 'Reproduce música', inline: true },
          { name: '!search [consulta]', value: 'Busca en YouTube', inline: true },
          { name: '!spotify [consulta]', value: 'Busca en Spotify', inline: true },
          { name: '!stop', value: 'Detiene la música', inline: true },
          { name: '!server', value: 'Info del servidor', inline: true },
          { name: '!help', value: 'Muestra esta ayuda', inline: true },
          { name: '🎵 Soporte', value: 'URLs de YouTube, Spotify, nombres de canciones', inline: false }
        ]
      });
      
      message.reply({ embeds: [embed] });
    }
  },
};
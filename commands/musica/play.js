const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce música de YouTube, playlists o por búsqueda')
    .addStringOption(option =>
      option.setName('cancion')
        .setDescription('URL, nombre de canción, artista o nombre de playlist')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('playlist')
        .setDescription('¿Buscar como playlist? (por defecto: canción)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('shuffle')
        .setDescription('¿Mezclar cola después de añadir?')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();
    } catch (e) {
      return;
    }
    
    const query = interaction.options.getString('cancion');
    const isPlaylist = interaction.options.getBoolean('playlist') || false;
    const shuffleOption = interaction.options.getBoolean('shuffle') || false;
    const voiceChannel = interaction.member?.voice?.channel;
    
    if (!voiceChannel) {
      return interaction.editReply({
        embeds: [
          createEmbed({
            color: COLORS.error,
            title: '❌ No estás en un canal de voz',
            description: 'Debes conectarte a un canal de voz primero.',
            fields: [
              {
                name: '📞 Qué hacer',
                value: 'Únete a un canal de voz e intenta de nuevo',
                inline: false,
              },
            ],
          }),
        ],
      });
    }
    
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.editReply({
        embeds: [
          createEmbed({
            color: COLORS.error,
            title: '❌ Permisos insuficientes',
            description: 'No tengo permisos para conectarme a este canal.',
            fields: [
              {
                name: '⚙️ Permisos necesarios',
                value: '`CONNECT` • `SPEAK`',
                inline: false,
              },
            ],
          }),
        ],
      });
    }
    
    try {
      const modoText = isPlaylist ? 'Playlist' : 'Canción';
      console.log(`🎯 /play (${modoText}) por ${interaction.user.tag}: "${query}"`);
      
      const loadingEmbed = createEmbed({
        color: COLORS.info,
        title: '🔍 Buscando...',
        description: `Buscando: **${query}**\n\nEsto puede tomar unos segundos...`,
        fields: [
          {
            name: '📋 Modo',
            value: modoText,
            inline: true,
          },
        ],
      });
      
      await interaction.editReply({ embeds: [loadingEmbed] });

      const resultado = await interaction.client.procesarCancion(voiceChannel, query, interaction, isPlaylist);
      
      if (resultado.exito) {
        const tipoEmoji = resultado.tipo === 'playlist' ? '📋' : '🎵';
        const accion = resultado.enCola ? 'Añadido a la cola' : 'Reproduciendo ahora';
        
        const embed = createEmbed({
          color: resultado.enCola ? COLORS.warning : COLORS.success,
          title: `${tipoEmoji} ${accion}`,
          description: `**${resultado.datos.title}**`,
          thumbnail: resultado.datos.thumbnail,
          fields: [
            {
              name: '⏱️ Duración',
              value: resultado.datos.duration,
              inline: true,
            },
            {
              name: '📍 Posición en cola',
              value: resultado.cantidad > 1 
                ? `#${resultado.posicion} (+${resultado.cantidad - 1})`
                : `#${resultado.posicion}`,
              inline: true,
            },
            {
              name: '👤 Solicitado por',
              value: interaction.user.username,
              inline: true,
            },
            ...( resultado.cantidad > 1 ? [{
              name: '📊 Canciones añadidas',
              value: `${resultado.cantidad} canción(es)`,
              inline: false,
            }] : []),
          ],
        });
        
        await interaction.editReply({ embeds: [embed] });
        
        if (shuffleOption && resultado.cantidad > 1) {
          const queue = interaction.client.getQueue(interaction.guildId);
          if (queue && queue.songs.length > 1) {
            queue.shuffle();
            
            await interaction.followUp({
              embeds: [
                createEmbed({
                  color: COLORS.secondary,
                  title: '🔀 Cola mezclada',
                  description: 'Las canciones han sido reorganizadas aleatoriamente.',
                }),
              ],
              flags: 64,
            });
          }
        }
        
      } else {
        await interaction.editReply({
          embeds: [
            createEmbed({
              color: COLORS.error,
              title: '❌ No encontrado',
              description: `No hay resultados para: **${query}**`,
              fields: [
                {
                  name: '💡 Sugerencia',
                  value: 'Intenta con un nombre más específico o una URL válida',
                  inline: false,
                },
              ],
            }),
          ],
        });
      }
      
    } catch (error) {
      console.error('❌ Error en /play:', error);
      
      await interaction.editReply({
        embeds: [
          createEmbed({
            color: COLORS.error,
            title: '❌ Error de reproducción',
            description: `No se pudo procesar: **${query.substring(0, 50)}**`,
            fields: [
              {
                name: 'Detalles',
                value: `\`${error.message.substring(0, 80)}\``,
                inline: false,
              },
            ],
          }),
        ],
      });
    }
  },
};

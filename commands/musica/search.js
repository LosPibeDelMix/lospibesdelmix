const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { search } = require('yt-search');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Busca canciones en YouTube y selecciona para añadir')
    .addStringOption(option =>
      option.setName('busqueda')
        .setDescription('Qué quieres buscar')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('resultados')
        .setDescription('Número de resultados a mostrar (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();
    } catch (e) {
      return;
    }
    
    const query = interaction.options.getString('busqueda');
    const maxResults = interaction.options.getInteger('resultados') || 5;
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.editReply({
        content: '❌ **Debes estar en un canal de voz para usar este comando.**',
        flags: 64
      });
    }
    
    try {      console.log(`📋 Búsqueda: "${query}" (${maxResults} resultados)`);
      
      const results = await search({ query, hl: 'es' });
      const videos = results.videos.slice(0, maxResults);
      
      if (videos.length === 0) {
        return interaction.editReply({
          content: `❌ No encontré resultados para: **${query}**`,
          flags: 64
        });
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setTitle(`🔍 Resultados para: "${query}"`)
        .setDescription(`Selecciona una canción para añadir a la cola:`)
        .setFooter({ 
          text: `Mostrando ${videos.length} de ${results.videos.length} resultados • Búsqueda de ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();
      
      // Añadir campos para cada resultado
      videos.forEach((video, index) => {
        embed.addFields({
          name: `**${index + 1}.** ${video.title.substring(0, 50)}${video.title.length > 50 ? '...' : ''}`,
          value: `⏱️ ${video.timestamp} • 👤 ${video.author.name || 'Desconocido'} • 👁️ ${video.views.toLocaleString()}`,
          inline: false
        });
      });
      
      // Crear menú de selección
      const selectOptions = videos.map((video, index) => ({
        label: `${index + 1}. ${video.title.substring(0, 100)}`,
        description: `${video.timestamp} • ${video.author.name || 'Desconocido'}`,
        value: video.videoId,
        emoji: this.getNumberEmoji(index + 1)
      }));
      
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('search_select')
        .setPlaceholder('Selecciona una canción...')
        .addOptions(selectOptions);
      
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      // Botones adicionales
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('search_add_all')
            .setLabel('➕ Añadir todas')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📥'),
          new ButtonBuilder()
            .setCustomId('search_cancel')
            .setLabel('❌ Cancelar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️')
        );
      
      const reply = await interaction.editReply({ 
        embeds: [embed], 
        components: [row, buttonRow]
      });
      
      const collector = reply.createMessageComponentCollector({ 
        time: 60000 
      });
      
      collector.on('collect', async (componentInteraction) => {
        if (componentInteraction.user.id !== interaction.user.id) {
          return componentInteraction.reply({ 
            content: '❌ Solo quien ejecutó la búsqueda puede seleccionar.', 
            flags: 64 
          });
        }
        
        if (componentInteraction.isStringSelectMenu()) {
          const videoId = componentInteraction.values[0];
          const video = videos.find(v => v.videoId === videoId);
          
          await componentInteraction.deferUpdate();
          
          try {
            const resultado = await interaction.client.procesarCancion(
              voiceChannel, 
              `https://youtube.com/watch?v=${videoId}`, 
              interaction
            );
            
            const resultEmbed = new EmbedBuilder()
              .setColor(0x2ECC71)
              .setTitle(resultado.enCola ? '➕ Canción añadida' : '🎵 Reproduciendo ahora')
              .setDescription(`**[${video.title}](${video.url})**`)
              .setThumbnail(video.thumbnail)
              .addFields(
                { name: '⏱️ Duración', value: `\`${video.timestamp}\``, inline: true },
                { name: '🎤 Artista', value: `\`${video.author.name}\``, inline: true },
                resultado.enCola ? 
                  { name: '📋 Posición', value: `\`#${resultado.posicion}\``, inline: true } :
                  { name: '🔊 Estado', value: '`▶️ Iniciando...`', inline: true }
              )
              .setFooter({ text: `Seleccionado por ${interaction.user.username}` })
              .setTimestamp();
            
            await componentInteraction.editReply({
              embeds: [resultEmbed],
              components: []
            });
            
          } catch (error) {
            console.error('Error procesando selección:', error);
            await componentInteraction.editReply({
              content: `❌ Error al añadir la canción: ${error.message}`,
              embeds: [],
              components: []
            });
          }
        } 
        
        else if (componentInteraction.isButton()) {
          if (componentInteraction.customId === 'search_add_all') {
            await componentInteraction.deferUpdate();
            
            let addedCount = 0;
            const errors = [];
            
            for (const video of videos) {
              try {
                await interaction.client.procesarCancion(
                  voiceChannel, 
                  video.url, 
                  { ...interaction, user: interaction.user }
                );
                addedCount++;
              } catch (error) {
                errors.push(`${video.title.substring(0, 30)}: ${error.message}`);
              }
            }
            
            const resultEmbed = new EmbedBuilder()
              .setColor(addedCount > 0 ? 0x2ECC71 : 0xE74C3C)
              .setTitle('📥 Resultado de añadir múltiples')
              .setDescription(`Se procesaron **${videos.length}** canciones:`)
              .addFields(
                { name: '✅ Añadidas exitosamente', value: `\`${addedCount}\``, inline: true },
                { name: '❌ Errores', value: `\`${errors.length}\``, inline: true },
                { name: '👤 Solicitado por', value: interaction.user.toString(), inline: true }
              )
              .setFooter({ text: `Búsqueda: "${query}"` })
              .setTimestamp();
            
            if (errors.length > 0) {
              resultEmbed.addFields({
                name: '⚠️ Errores detallados',
                value: errors.slice(0, 3).map(e => `• ${e}`).join('\n') + (errors.length > 3 ? `\n...y ${errors.length - 3} más` : ''),
                inline: false
              });
            }
            
            await componentInteraction.editReply({
              embeds: [resultEmbed],
              components: []
            });
            
          } else if (componentInteraction.customId === 'search_cancel') {
            await componentInteraction.update({
              content: '❌ **Búsqueda cancelada.**',
              embeds: [],
              components: []
            });
          }
        }
      });
      
      collector.on('end', collected => {
        if (collected.size === 0) {
          reply.edit({ 
            content: '⏰ **Búsqueda cancelada por tiempo.**', 
            embeds: [], 
            components: [] 
          }).catch(() => {});
        }
      });
      
    } catch (error) {
      console.error('Error en /search:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('❌ Error en búsqueda')
        .setDescription(`No se pudo completar la búsqueda para: **${query}**`)
        .addFields(
          { name: 'Detalles', value: `\`${error.message.substring(0, 150)}\`` },
          { name: 'Solución', value: 'Intenta con términos de búsqueda diferentes o más específicos' }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  getNumberEmoji(number) {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return emojis[number - 1] || '🎵';
  }
};
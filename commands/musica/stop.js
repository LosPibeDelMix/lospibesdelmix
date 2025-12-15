const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createEmbed, createErrorEmbed, createSuccessEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene completamente la reproducción y limpia la cola'),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ No hay música reproduciéndose',
          'No hay nada que detener ahora.'
        )],
        ephemeral: true
      });
    }
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ Canal de voz incorrecto',
          'Debes estar en el mismo canal de voz que el bot.'
        )],
        ephemeral: true
      });
    }
    
    const embed = createEmbed({
      color: COLORS.error,
      title: '🛑 Confirmar detención',
      description: `¿Seguro que quieres detener la música y limpiar la cola?\n\n**Canciones a eliminar: ${queue.songs.length}**`,
      fields: [
        { name: '🎵 Actual', value: `**${queue.songs[0].title}**`, inline: false },
        { name: '📋 Pendientes', value: `\`${queue.songs.length - 1}\` canciones`, inline: true },
        { name: '👤 Solicitado por', value: interaction.user.username, inline: true }
      ]
    });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('stop_confirm')
          .setLabel('Sí, detener')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId('stop_cancel')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );
    
    const reply = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true 
    });
    
    const filter = (btnInteraction) => btnInteraction.user.id === interaction.user.id;
    
    try {
      const confirmation = await reply.awaitMessageComponent({ filter, time: 15000 });
      
      if (confirmation.customId === 'stop_confirm') {
        const songCount = queue.songs.length;
        queue.disconnect();
        
        const successEmbed = createSuccessEmbed(
          '⏹️ Música detenida',
          `Se detuvieron **${songCount}** canción(es). La cola ha sido limpiada.`,
          [
            { name: '👤 Detenido por', value: interaction.user.username, inline: true },
            { name: '🔈 Estado', value: 'Bot desconectado', inline: true }
          ]
        );
        
        await confirmation.update({ embeds: [successEmbed], components: [] });      } else {
        await confirmation.update({ 
          embeds: [createSuccessEmbed(
            '✅ Cancelado',
            'La música continúa reproduciéndose.'
          )],
          components: [] 
        });
      }
    } catch (error) {
      await interaction.editReply({ 
        embeds: [createEmbed({
          color: COLORS.warning,
          title: '⏰ Confirmación expirada',
          description: 'La música continúa reproduciéndose.'
        })],
        components: [] 
      });
    }
  }
};
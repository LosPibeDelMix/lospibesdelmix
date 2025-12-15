const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, createErrorEmbed, createWarningEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la reproducción actual'),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    
    if (!queue || !queue.isPlaying) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ No hay música reproduciéndose',
          'No hay nada para pausar. Usa `/play` para añadir música.'
        )],
        ephemeral: true,
      });
    }

    if (!queue.isPlaying) {
      return interaction.reply({ 
        embeds: [createWarningEmbed(
          '⏸️ Ya está pausada',
          'La reproducción ya está pausada. Usa `/resume` para continuar.'
        )],
        ephemeral: true,
      });
    }
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ Canal de voz incorrecto',
          'Debes estar en el mismo canal de voz que el bot.'
        )],
        ephemeral: true,
      });
    }
    
    queue.player.pause();
    
    const embed = createEmbed({
      color: COLORS.warning,
      title: '⏸️ Reproducción Pausada',
      description: `**${queue.songs[0].title}**`,
      fields: [
        {
          name: '⏱️ Duración',
          value: queue.songs[0].duration,
          inline: true,
        },
        {
          name: '👤 Pausado por',
          value: interaction.user.username,
          inline: true,
        },
        {
          name: '📋 Cola',
          value: `${queue.songs.length} canción(es)`,
          inline: true,
        },
        {
          name: '💡 Próximo paso',
          value: 'Usa `/resume` para continuar reproduciendo',
          inline: false,
        },
      ],
    });
    
    await interaction.reply({ embeds: [embed] });
  }
};

const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la reproducción pausada'),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    
    if (!queue || queue.isPlaying) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ No hay música pausada',
          'La reproducción no está pausada o no hay cola activa.'
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
    
    queue.player.unpause();
    
    const embed = createEmbed({
      color: COLORS.success,
      title: '▶️ Reproducción Reanudada',
      description: `**${queue.songs[0].title}**`,
      fields: [
        {
          name: '⏱️ Duración',
          value: queue.songs[0].duration,
          inline: true,
        },
        {
          name: '👤 Reanudado por',
          value: interaction.user.username,
          inline: true,
        },
        {
          name: '📋 Cola',
          value: `${queue.songs.length} canción(es)`,
          inline: true,
        },
      ],
    });
    
    await interaction.reply({ embeds: [embed] });
  }
};

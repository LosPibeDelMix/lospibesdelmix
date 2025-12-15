const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la canción que se está reproduciendo ahora'),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    
    if (!queue || !queue.songs[0]) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ Nada reproduciéndose',
          'No hay música reproduciéndose en este servidor.\n\nUsa `/play` para añadir música.'
        )],
        ephemeral: true,
      });
    }
    
    const song = queue.songs[0];
    const statusText = queue.isPlaying 
      ? '▶️ Reproduciendo'
      : '⏸️ Pausada';
    
    const embed = createEmbed({
      color: COLORS.primary,
      title: `${statusText} Ahora`,
      description: `**${song.title}**`,
      thumbnail: song.thumbnail,
      fields: [
        {
          name: '⏱️ Duración',
          value: song.duration,
          inline: true,
        },
        {
          name: '📍 Posición',
          value: `1/${queue.songs.length}`,
          inline: true,
        },
        {
          name: '👤 Solicitado por',
          value: song.requester,
          inline: true,
        },
        {
          name: '📊 Estado',
          value: statusText,
          inline: true,
        },
        {
          name: '📋 En cola',
          value: `${queue.songs.length - 1} canción(es)`,
          inline: true,
        },
        {
          name: '🔗 YouTube',
          value: `[Ver en YouTube](${song.url})`,
          inline: true,
        },
      ],
    });
    
    await interaction.reply({ embeds: [embed] });
  }
};

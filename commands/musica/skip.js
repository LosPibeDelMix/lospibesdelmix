const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, createErrorEmbed, createInfoEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la canción actual')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Número de canciones a saltar (por defecto: 1)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    const skipCount = Math.min(interaction.options.getInteger('cantidad') || 1, 10);
    
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ No hay música',
          'No hay canciones en reproducción.'
        )],
        ephemeral: true,
      });
    }
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ Canal de voz incorrecto',
          'Debes estar en el mismo canal que el bot.'
        )],
        ephemeral: true,
      });
    }
    
    if (queue.songs.length <= skipCount) {
      queue.disconnect();
      return interaction.reply({
        embeds: [createInfoEmbed(
          '⏭️ Cola Limpiada',
          `Se saltaron todas las ${queue.songs.length} canciones restantes.`,
          [{ name: '👤 Solicitado por', value: interaction.user.username, inline: false }]
        )],
      });
    }
    
    const skippedSongs = queue.songs.slice(0, skipCount).map(s => s.title);
    
    for (let i = 0; i < skipCount - 1; i++) {
      queue.songs.shift();
    }
    
    queue.handleSongEnd();
    
    const nextSong = queue.songs[0] || null;
    
    const embed = createEmbed({
      color: COLORS.info,
      title: skipCount > 1 ? '⏭️ Canciones Saltadas' : '⏭️ Canción Saltada',
      description: skipCount > 1 
        ? `Se saltaron **${skipCount}** canción(es) exitosamente.`
        : `Saltada: **${skippedSongs[0]}**`,
      fields: [
        {
          name: '👤 Solicitado por',
          value: interaction.user.username,
          inline: true,
        },
        {
          name: '📋 Ahora reproduciendo',
          value: nextSong ? `**${nextSong.title}**` : 'Cola vacía',
          inline: true,
        },
        {
          name: '🎶 En cola',
          value: `${queue.songs.length} canción(es)`,
          inline: true,
        },
      ],
    });
    
    await interaction.reply({ embeds: [embed] });
    console.log(`⏭️ ${skipCount} canción(es) saltadas por ${interaction.user.tag}`);
  }
};

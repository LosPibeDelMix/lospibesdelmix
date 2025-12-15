const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de reproducción')
    .addIntegerOption(option =>
      option.setName('pagina')
        .setDescription('Número de página (10 canciones por página)')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    const page = interaction.options.getInteger('pagina') || 1;
    
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ Cola vacía',
          'No hay canciones en la cola.\n\nUsa `/play` para añadir música y comenzar a reproducir.'
        )],
        ephemeral: true,
      });
    }
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil((queue.songs.length - 1) / itemsPerPage) || 1;
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, queue.songs.length - 1);
    
    const embed = createEmbed({
      color: COLORS.secondary,
      title: '📋 Cola de Reproducción',
      description: `**Página ${currentPage}/${totalPages}** • **Total:** ${queue.songs.length} canción(es)`,
      thumbnail: queue.songs[0]?.thumbnail || null,
    });
    
    if (queue.songs[0]) {
      const statusIcon = queue.isPlaying 
        ? '▶️ Reproduciendo'
        : '⏸️ Pausada';
      
      embed.addFields({
        name: `🎵 ${statusIcon}`,
        value: `**${queue.songs[0].title}**\n⏱️ ${queue.songs[0].duration} • 👤 ${queue.songs[0].requester}`,
        inline: false
      });
    }
    
    if (queue.songs.length > 1) {
      const songsList = queue.songs.slice(startIndex, endIndex + 1).map((song, index) => {
        const pos = startIndex + index;
        return `\`${pos}.\` **${song.title.substring(0, 45)}**\n   ⏱️ ${song.duration}`;
      }).join('\n\n');
      
      embed.addFields({
        name: `🎶 Próximas (${queue.songs.length - 1})`,
        value: songsList || 'No hay más canciones en esta página',
        inline: false
      });
    }
    
    const loopStatus = queue.loop === 0 
      ? '🔁 Desactivado' 
      : queue.loop === 1 
        ? '🔂 Una canción'
        : '🔁 Toda la cola';
    
    embed.addFields(
      { 
        name: '⏱️ Estado', 
        value: queue.playing ? (queue.paused ? '⏸️ Pausada' : '▶️ Reproduciendo') : '⏹️ Detenida', 
        inline: true 
      },
      { 
        name: '📊 En cola', 
        value: `${queue.songs.length - 1}`, 
        inline: true 
      },
      { 
        name: '🔁 Repetición', 
        value: loopStatus, 
        inline: true 
      }
    );
    
    embed.setFooter({ 
      text: `Los Pibes Del Mix 🎵 • Página ${currentPage}/${totalPages}` 
    });
    
    await interaction.reply({ embeds: [embed] });
  }
};

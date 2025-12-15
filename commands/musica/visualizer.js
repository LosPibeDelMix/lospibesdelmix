const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const COLORS = {
  primary: 0x1DB954,
  success: 0x2ECC71,
  warning: 0xF39C12,
  error: 0xE74C3C,
  info: 0x3498DB,
  secondary: 0x9B59B6,
};

const createEmbed = (options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.primary)
    .setFooter({ text: 'Los Pibes Del Mix 🎵' })
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields) embed.addFields(...options.fields);

  return embed;
};

const generateVisualizer = () => {
  const bars = ['▂', '▄', '▅', '▆', '▇', '█'];
  let visualizer = '';
  for (let i = 0; i < 12; i++) {
    const randomBar = bars[Math.floor(Math.random() * bars.length)];
    visualizer += randomBar + ' ';
  }
  return visualizer;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('visualizer')
    .setDescription('Muestra un visualizador de la música actual'),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.error,
          title: '❌ No hay música',
          description: 'No hay canción en reproducción',
        })],
        flags: 64,
      });
    }

    const song = queue.songs[0];
    const visualizer = generateVisualizer();

    interaction.reply({
      embeds: [createEmbed({
        color: COLORS.success,
        title: '🎵 Visualizador de Música',
        description: `\`\`\`\n${visualizer}\n\`\`\``,
        fields: [
          {
            name: '🎶 Canción Actual',
            value: `**${song.title}**`,
            inline: false,
          },
          {
            name: '🔊 Volumen',
            value: `${'█'.repeat(Math.round(queue.volume * 10))}${'░'.repeat(10 - Math.round(queue.volume * 10))}`,
            inline: true,
          },
          {
            name: '⏸️ Estado',
            value: queue.paused ? 'Pausado' : 'Reproduciendo',
            inline: true,
          },
        ],
      })],
    });
  },
};

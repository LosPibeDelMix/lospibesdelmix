const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const themes = {
  spotify: { primary: 0x1DB954, name: '🟢 Spotify' },
  night: { primary: 0x1a1a1a, name: '🌙 Night' },
  ocean: { primary: 0x0077BE, name: '🌊 Ocean' },
  sunset: { primary: 0xFF6B35, name: '🌅 Sunset' },
  purple: { primary: 0x9B59B6, name: '💜 Purple' },
  pink: { primary: 0xFF1493, name: '💗 Pink' },
};

const createEmbed = (color, options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: 'Los Pibes Del Mix 🎵' })
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields) embed.addFields(...options.fields);

  return embed;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('theme')
    .setDescription('Cambia el tema de colores del bot')
    .addStringOption(opt =>
      opt.setName('tema')
        .setDescription('Selecciona un tema')
        .addChoices(
          { name: '🟢 Spotify', value: 'spotify' },
          { name: '🌙 Night', value: 'night' },
          { name: '🌊 Ocean', value: 'ocean' },
          { name: '🌅 Sunset', value: 'sunset' },
          { name: '💜 Purple', value: 'purple' },
          { name: '💗 Pink', value: 'pink' }
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const themeKey = interaction.options.getString('tema');
    const theme = themes[themeKey];

    if (!theme) {
      return interaction.reply({
        embeds: [createEmbed(0xE74C3C, {
          title: '❌ Tema no encontrado',
          description: 'Intenta con otro tema',
        })],
        flags: 64,
      });
    }

    const themeList = Object.entries(themes)
      .map(([key, t]) => `${t.name}`)
      .join('\n');

    interaction.reply({
      embeds: [createEmbed(theme.primary, {
        title: `🎨 Tema Cambio: ${theme.name}`,
        description: 'El tema se ha aplicado correctamente',
        fields: [
          {
            name: '📋 Temas Disponibles',
            value: themeList,
            inline: false,
          },
        ],
      })],
    });
  },
};

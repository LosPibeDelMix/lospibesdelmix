const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const lyricsFinder = require('lyrics-finder');

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Busca la letra de una canción')
    .addStringOption(option =>
      option
        .setName('cancion')
        .setDescription('Nombre de la canción (deja vacío para la canción actual)')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
    } catch (e) {
      return;
    }
    
    const queue = interaction.client.getQueue(interaction.guildId);
    let songName = interaction.options.getString('cancion');
    
    if (!songName && queue && queue.songs.length > 0) {
      songName = queue.songs[0].title;
    }
    
    if (!songName) {
      return interaction.editReply({
        embeds: [createEmbed({
          color: COLORS.error,
          title: '❌ Error',
          description: 'Debes especificar una canción o haber una reproduciéndose',
        })],
      });
    }
    
    try {
      const cleanName = songName
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const lyrics = await lyricsFinder(cleanName);
      
      if (!lyrics) {
        return interaction.editReply({
          embeds: [createEmbed({
            color: COLORS.warning,
            title: '❌ No encontrada',
            description: `No se encontraron letras para: **${cleanName}**`,
          })],
        });
      }
      
      const lyricsChunks = lyrics.match(/[\s\S]{1,4096}/g) || [];
      
      for (let i = 0; i < lyricsChunks.length; i++) {
        const embed = createEmbed({
          color: COLORS.secondary,
          title: `📝 Letra: ${cleanName}`,
          description: lyricsChunks[i],
          fields: [
            {
              name: `📄 Página ${i + 1}/${lyricsChunks.length}`,
              value: 'Powered by Genius',
              inline: false,
            },
          ],
        });
        
        if (i === 0) {
          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.followUp({ embeds: [embed] });
        }
      }
    } catch (error) {
      await interaction.editReply({
        embeds: [createEmbed({
          color: COLORS.error,
          title: '❌ Error',
          description: 'Hubo un error al buscar las letras',
        })],
      });
    }
  },
};
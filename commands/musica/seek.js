const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Avanza/retrocede en la canción actual')
    .addStringOption(option =>
      option
        .setName('tiempo')
        .setDescription('Tiempo en formato (mm:ss o segundos)')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guild);
    
    if (!queue) {
      return interaction.reply({
        content: '❌ No hay ninguna canción reproduciéndose.',
        flags: 64,
      });
    }
    
    if (!interaction.member.voice.channel) {
      return interaction.reply({
        content: '❌ Debes estar en un canal de voz.',
        flags: 64,
      });
    }
    
    if (interaction.member.voice.channel !== queue.voice.channel) {
      return interaction.reply({
        content: '❌ Debes estar en el mismo canal de voz que el bot.',
        flags: 64,
      });
    }
    
    const tiempo = interaction.options.getString('tiempo');
    let seconds;
    
    // Verificar formato mm:ss
    if (tiempo.includes(':')) {
      const parts = tiempo.split(':').map(Number);
      if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else {
        return interaction.reply({
          content: '❌ Formato inválido. Usa mm:ss o segundos.',
          flags: 64,
        });
      }
    } else {
      seconds = parseInt(tiempo);
    }
    
    if (isNaN(seconds) || seconds < 0 || seconds > queue.songs[0].duration) {
      return interaction.reply({
        content: `❌ Tiempo inválido. La canción dura ${queue.songs[0].formattedDuration}.`,
        flags: 64,
      });
    }
    
    try {
      await queue.seek(seconds);
      await interaction.reply(`⏩ Saltando a \`${queue.formattedCurrentTime}\``);
    } catch (error) {
      await interaction.reply(`❌ Error: ${error.message}`);
    }
  },
};
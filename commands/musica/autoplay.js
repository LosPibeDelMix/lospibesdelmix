const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Activa/desactiva el modo autoplay'),
  
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
    
    try {
      const autoplay = queue.toggleAutoplay();
      await interaction.reply(
        autoplay
          ? '🔁 **Autoplay activado** - Se agregarán canciones relacionadas automáticamente.'
          : '❌ **Autoplay desactivado**'
      );
    } catch (error) {
      await interaction.reply(`❌ Error: ${error.message}`);
    }
  },
};
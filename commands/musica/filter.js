const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Aplica filtros de audio a la música')
    .addStringOption(option =>
      option
        .setName('filtro')
        .setDescription('Filtro a aplicar')
        .addChoices(
          { name: '3d', value: '3d' },
          { name: 'bassboost', value: 'bassboost' },
          { name: 'echo', value: 'echo' },
          { name: 'karaoke', value: 'karaoke' },
          { name: 'nightcore', value: 'nightcore' },
          { name: 'vaporwave', value: 'vaporwave' },
          { name: 'flanger', value: 'flanger' },
          { name: 'gate', value: 'gate' },
          { name: 'haas', value: 'haas' },
          { name: 'reverse', value: 'reverse' },
          { name: 'surround', value: 'surround' },
          { name: 'mcompand', value: 'mcompand' },
          { name: 'phaser', value: 'phaser' },
          { name: 'tremolo', value: 'tremolo' },
          { name: 'earwax', value: 'earwax' },
          { name: 'Limpiar filtros', value: 'off' }
        )
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
    
    const filter = interaction.options.getString('filtro');
    
    try {
      if (filter === 'off') {
        await queue.filters.clear();
        await interaction.reply('🧹 Filtros limpiados.');
      } else {
        await queue.filters.toggle(filter);
        await interaction.reply(
          queue.filters.has(filter)
            ? `✅ Filtro **${filter}** activado.`
            : `❌ Filtro **${filter}** desactivado.`
        );
      }
    } catch (error) {
      await interaction.reply(`❌ Error: ${error.message}`);
    }
  },
};
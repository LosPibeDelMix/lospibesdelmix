const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mezcla aleatoriamente las canciones en la cola'),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    
    if (!queue || queue.songs.length <= 2) {
      return interaction.reply({ 
        content: queue ? 
          '❌ **Necesitas al menos 2 canciones en la cola para mezclar.**' : 
          '❌ **No hay cola activa.**', 
        flags: 64 
      });
    }
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
      return interaction.reply({ 
        content: '❌ **Debes estar en el mismo canal de voz que el bot.**', 
        flags: 64 
      });
    }
    
    // Guardar canción actual
    const currentSong = queue.songs[0];
    const queueBefore = [...queue.songs.slice(1)];
    
    // Mezclar canciones (excepto la actual)
    const shuffled = this.shuffleArray([...queue.songs.slice(1)]);
    
    // Reconstruir cola (mantener canción actual en reproducción)
    queue.songs = [currentSong, ...shuffled];
    
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🔀 Cola mezclada')
      .setDescription(`**${queue.songs.length - 1}** canciones han sido mezcladas aleatoriamente.`)
      .addFields(
        { name: '🎵 Canción actual', value: `[${currentSong.title}](${currentSong.url})`, inline: false },
        { name: '📊 Estadísticas', value: `\`${this.getShuffleStats(queueBefore, shuffled)}\``, inline: false },
        { name: '👤 Mezclado por', value: interaction.user.toString(), inline: true },
        { name: '🎲 Aleatoriedad', value: `\`${Math.random().toFixed(2)}\``, inline: true }
      )
      .setFooter({ text: 'El orden ha sido cambiado completamente' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
    console.log(`🔀 Cola mezclada (${queue.songs.length - 1} canciones) por ${interaction.user.tag}`);
  },

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  getShuffleStats(before, after) {
    let samePosition = 0;
    for (let i = 0; i < Math.min(before.length, after.length); i++) {
      if (before[i] && after[i] && before[i].url === after[i].url) {
        samePosition++;
      }
    }
    
    const percentageSame = ((samePosition / before.length) * 100).toFixed(1);
    return `Cambios: ${before.length - samePosition}/${before.length} (${percentageSame}% igual)`;
  }
};
const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot y estado del sistema'),

  async execute(interaction) {
    const start = Date.now();
    const botPing = interaction.client.ws.ping;
    const apiPing = Date.now() - start;
    const uptime = process.uptime();
    
    const queue = interaction.client.getQueue(interaction.guildId);
    const memoryUsage = process.memoryUsage();
    
    const embed = createEmbed({
      color: this.getPingColor(botPing),
      title: '🏓 Pong!',
      description: 'Estado del sistema y latencias:',
      fields: [
        { 
          name: '📶 Latencias', 
          value: `**Bot → Discord:** \`${botPing}ms\`\n**API Discord:** \`${apiPing}ms\``, 
          inline: false 
        },
        { 
          name: '🖥️ Sistema', 
          value: `**Uptime:** \`${this.formatUptime(uptime)}\`\n**Memoria:** \`${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\``, 
          inline: false 
        },
        { 
          name: '🤖 Bot', 
          value: `**Servidores:** \`${interaction.client.guilds.cache.size}\`\n**Comandos:** \`${interaction.client.commands.size}\``, 
          inline: true 
        }
      ]
    });
    
    if (queue) {
      embed.addFields({
        name: '🎵 Estado música',
        value: `**Reproduciendo:** ${queue.isPlaying ? '✅' : '❌'}\n**Canciones:** \`${queue.songs.length}\`\n**Volumen:** \`${Math.round(queue.volume * 100)}%\``,
        inline: true
      });
    }
    
    // Calcular calidad de conexión
    let calidad = 'Excelente';
    let emoji = '✅';
    
    if (botPing > 200) {
      calidad = 'Mala';
      emoji = '❌';
    } else if (botPing > 100) {
      calidad = 'Regular';
      emoji = '⚠️';
    }
    
    embed.data.footer.text += ` • Calidad: ${calidad} ${emoji}`;
    
    await interaction.reply({ embeds: [embed] });
    
    // Log de diagnóstico
    const logger = require('../../utils/logger');
    logger.info(`Ping: Bot=${botPing}ms, API=${apiPing}ms, Uptime=${Math.floor(uptime / 60)}min`);
  },

  getPingColor(ping) {
    if (ping < 100) return 0x2ECC71; // Verde
    if (ping < 200) return 0xF39C12; // Naranja
    return 0xE74C3C; // Rojo
  },

  formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }
};
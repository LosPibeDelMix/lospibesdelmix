const logger = require('../utils/logger');
const { ActivityType, REST, Routes } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.success(`${client.user.tag} está en línea!`);
    logger.info(`Servidores: ${client.guilds.cache.size}`);
    
    // Registrar comandos automáticamente
    try {
      logger.info('Registrando comandos slash...');
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
      
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );
      
      logger.success(`${commands.length} comandos registrados`);
    } catch (error) {
      logger.error('Error registrando comandos:', error.message);
    }
    
    // Establecer estado
    client.user.setPresence({
      activities: [{
        name: '🎵 /play para música',
        type: ActivityType.Listening,
      }],
      status: 'online',
    });
    
    // Rotar estados cada 30 minutos
    setInterval(() => {
      const activities = [
        { name: '🎵 /play para música', type: ActivityType.Listening },
        { name: `${client.guilds.cache.size} servidores`, type: ActivityType.Watching },
        { name: 'Spotify & YouTube', type: ActivityType.Listening },
        { name: 'música con amigos', type: ActivityType.Playing },
      ];
      
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      client.user.setPresence({
        activities: [randomActivity],
        status: 'online',
      });
    }, 30 * 60 * 1000); // 30 minutos
  },
};
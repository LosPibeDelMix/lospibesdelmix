const logger = require('../utils/logger');
const { createErrorEmbed } = require('../utils/embedUtils');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.warning(`Comando no encontrado: ${interaction.commandName}`);
      return;
    }

    try {
      logger.info(`Ejecutando comando: ${interaction.commandName} por ${interaction.user.tag}`);
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(`Error ejecutando ${interaction.commandName}:`, error);
      
      const errorEmbed = createErrorEmbed(
        '❌ Error de comando',
        'Hubo un error ejecutando este comando. Inténtalo de nuevo.',
        [{ name: 'Comando', value: interaction.commandName, inline: true }]
      );

      const errorMessage = {
        embeds: [errorEmbed],
        ephemeral: true,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (followUpError) {
        logger.error('Error enviando mensaje de error:', followUpError);
      }
    }
  },
};
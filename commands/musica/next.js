const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription('Salta a la siguiente canción (alias de skip)'),
    
    async execute(interaction, client) {
        const queue = client.distube.getQueue(interaction.guildId);
        
        if (!queue) {
            return interaction.reply({ 
                content: '❌ No hay nada reproduciéndose.', 
                flags: 64 
            });
        }
        
        try {
            queue.skip();
            interaction.reply('⏭️ Saltando a la siguiente canción...');
        } catch (error) {
            console.error(error);
            interaction.reply('❌ Error al saltar (¿no hay más canciones?).');
        }
    }
};

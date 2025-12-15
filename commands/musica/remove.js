const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Elimina una canción de la cola')
        .addIntegerOption(option =>
            option.setName('posicion')
                .setDescription('Posición de la canción a eliminar')
                .setRequired(true)
                .setMinValue(1)),
    async execute(interaction, client) {
        try {
            await interaction.deferReply();
        } catch (e) {
            return;
        }
        
        const queue = client.distube.getQueue(interaction.guild);
        const position = interaction.options.getInteger('posicion');
        
        if (!queue) {
            const embed = new EmbedBuilder()
                .setColor('#FF9900')
                .setTitle('❌ **Sin cola**')
                .setDescription('No hay cola de reproducción')
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
        
        if (position < 1 || position >= queue.songs.length) {
            const embed = new EmbedBuilder()
                .setColor('#FF9900')
                .setTitle('❌ **Posición inválida**')
                .setDescription(`Posiciones válidas: 1-${queue.songs.length - 1}`)
                .addFields(
                    { name: 'Canciones en cola', value: `${queue.songs.length - 1}`, inline: true }
                )
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
        
        try {
            const song = queue.songs[position];
            await queue.songs.splice(position, 1);
            
            const embed = new EmbedBuilder()
                .setColor('#FF6666')
                .setTitle('🗑️ **Canción eliminada**')
                .setDescription(`Eliminada: **[${song.name}](${song.url})**`)
                .addFields(
                    { name: 'Posición', value: `${position}`, inline: true },
                    { name: 'Duración', value: song.formattedDuration, inline: true },
                    { name: 'Eliminada por', value: interaction.user.toString(), inline: true }
                )
                .setThumbnail(song.thumbnail)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ **Error**')
                .setDescription(`No se pudo eliminar: ${error.message}`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
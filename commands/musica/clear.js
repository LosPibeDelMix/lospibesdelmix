const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpia la cola de reproducción')
    .addBooleanOption(option =>
      option.setName('incluir_actual')
        .setDescription('¿Detener canción actual también?')
        .setRequired(false)
    ),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    const incluirActual = interaction.options.getBoolean('incluir_actual') || false;
    
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ 
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Cola vacía')
            .setDescription('No hay canciones en la cola para limpiar.')
            .setFooter({ text: 'Los Pibes Del Mix' })
        ],
        flags: 64 
      });
    }
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
      return interaction.reply({ 
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Canal de voz incorrecto')
            .setDescription('Debes estar en el mismo canal de voz que el bot.')
            .setFooter({ text: 'Los Pibes Del Mix' })
        ],
        flags: 64 
      });
    }
    
    const cancionesAEliminar = incluirActual ? queue.songs.length : queue.songs.length - 1;
    
    if (cancionesAEliminar === 0) {
      return interaction.reply({ 
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ Nada que limpiar')
            .setDescription('No hay canciones en la cola después de la actual.')
            .setFooter({ text: 'Los Pibes Del Mix' })
        ],
        flags: 64 
      });
    }
    
    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('🗑️ Confirmar limpieza')
      .setDescription(`¿Eliminar **${cancionesAEliminar}** canción(es)?${incluirActual ? '\n⚠️ Se detendrá la música actual también.' : ''}`)
      .addFields(
        { name: '🎵 Canción actual', value: `**${queue.songs[0].title}**`, inline: false },
        { name: '📊 Canciones en cola', value: `${queue.songs.length - 1} después de esta`, inline: true }
      )
      .setFooter({ text: 'Esta acción no se puede deshacer' });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('clear_confirm')
          .setLabel('Sí, limpiar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId('clear_cancel')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );
    
    const reply = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true 
    });
    
    const filter = (btnInteraction) => btnInteraction.user.id === interaction.user.id;
    
    try {
      const confirmation = await reply.awaitMessageComponent({ filter, time: 15000 });
      
      if (confirmation.customId === 'clear_confirm') {
        if (incluirActual) {
          queue.stop();
        } else {
          queue.songs = [queue.songs[0]];
        }
        
        const successEmbed = new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle('✅ Cola limpiada')
          .setDescription(`Se eliminaron **${cancionesAEliminar}** canción(es).${incluirActual ? '\n⏹️ La música se ha detenido.' : ''}`)
          .addFields({ name: '📋 Canciones restantes', value: incluirActual ? '0' : '1 (actual)' })
          .setFooter({ text: 'Los Pibes Del Mix 🎵' })
          .setTimestamp();
        
        await confirmation.update({ embeds: [successEmbed], components: [] });
        console.log(`🗑️ Cola limpiada por ${interaction.user.tag} (${cancionesAEliminar} canciones)`);
      } else {
        await confirmation.update({ 
          embeds: [
            new EmbedBuilder()
              .setColor(0x2ECC71)
              .setTitle('✅ Cancelado')
              .setDescription('La cola se mantiene intacta.')
              .setFooter({ text: 'Los Pibes Del Mix' })
          ],
          components: [] 
        });
      }
    } catch (error) {
      await interaction.editReply({ 
        embeds: [
          new EmbedBuilder()
            .setColor(0xF39C12)
            .setTitle('⏰ Confirmación expirada')
            .setDescription('La cola se mantiene intacta.')
            .setFooter({ text: 'Los Pibes Del Mix' })
        ],
        components: [] 
      });
    }
  }
};

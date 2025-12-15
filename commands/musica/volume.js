const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el volumen de reproducción')
    .addIntegerOption(option =>
      option.setName('nivel')
        .setDescription('Nivel de volumen (0-200%) - omite para ver actual')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(200)
    ),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    const nivel = interaction.options.getInteger('nivel');
    
    if (!queue) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ No hay música reproduciéndose',
          'No hay cola activa para ajustar el volumen.'
        )],
        ephemeral: true
      });
    }
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== queue.voiceChannel.id) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ Canal de voz incorrecto',
          'Debes estar en el mismo canal de voz que el bot.'
        )],
        ephemeral: true
      });
    }
    
    // Si no se especifica nivel, mostrar volumen actual con controles
    if (nivel === null) {
      return this.showVolumeControls(interaction, queue);
    }
    
    const volumenAnterior = Math.round(queue.volume * 100);
    queue.volume = nivel / 100;
    const nuevoVolumen = nivel;
    
    const embed = createEmbed({
      color: this.getVolumeColor(nuevoVolumen),
      title: '🔊 Volumen ajustado',
      description: `**${volumenAnterior}%** → **${nuevoVolumen}%**`,
      fields: [
        { name: '👤 Solicitado por', value: interaction.user.toString(), inline: true },
        { name: '🎧 Nivel actual', value: `\`${nuevoVolumen}%\``, inline: true },
        { name: '📊 Intensidad', value: this.getVolumeBar(nuevoVolumen), inline: false }
      ]
    });
    
    if (nuevoVolumen >= 150) {
      embed.data.footer.text = '⚠️ Volumen muy alto puede causar distorsión';
    }
    
    await interaction.reply({ embeds: [embed] });
  },

  async showVolumeControls(interaction, queue) {
    const currentVolume = Math.round(queue.volume * 100);
    const embed = createEmbed({
      color: COLORS.info,
      title: '🔊 Controles de volumen',
      description: `Volumen actual: **${currentVolume}%**\n${this.getVolumeBar(currentVolume)}`,
      fields: [
        { name: 'Recomendaciones', value: '• 0-50%: Bajo\n• 50-100%: Normal\n• 100-150%: Alto\n• 150-200%: Muy alto', inline: false }
      ]
    });
    
    embed.data.footer.text = 'Usa los botones para ajustar o /volume [nivel]';
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('volume_mute')
          .setLabel('🔇 Silenciar')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('volume_25')
          .setLabel('25%')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('volume_50')
          .setLabel('50%')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('volume_75')
          .setLabel('75%')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('volume_100')
          .setLabel('100%')
          .setStyle(ButtonStyle.Success)
      );
    
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('volume_125')
          .setLabel('125%')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('volume_150')
          .setLabel('150%')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('volume_175')
          .setLabel('175%')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('volume_200')
          .setLabel('200%')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('volume_custom')
          .setLabel('Personalizar')
          .setStyle(ButtonStyle.Secondary)
      );
    
    const reply = await interaction.reply({ 
      embeds: [embed], 
      components: [row, row2],
      fetchReply: true 
    });
    
    const collector = reply.createMessageComponentCollector({ 
      time: 60000 
    });
    
    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        return buttonInteraction.reply({ 
          content: '❌ Solo quien ejecutó el comando puede usar estos controles.', 
          flags: 64 
        });
      }
      
      let nuevoVolumen = queue.volume;
      
      switch (buttonInteraction.customId) {
        case 'volume_mute':
          nuevoVolumen = 0;
          break;
        case 'volume_25':
          nuevoVolumen = 25;
          break;
        case 'volume_50':
          nuevoVolumen = 50;
          break;
        case 'volume_75':
          nuevoVolumen = 75;
          break;
        case 'volume_100':
          nuevoVolumen = 100;
          break;
        case 'volume_125':
          nuevoVolumen = 125;
          break;
        case 'volume_150':
          nuevoVolumen = 150;
          break;
        case 'volume_175':
          nuevoVolumen = 175;
          break;
        case 'volume_200':
          nuevoVolumen = 200;
          break;
        case 'volume_custom':
          // Podría abrir un modal para entrada personalizada
          await buttonInteraction.reply({
            content: '💡 Usa `/volume [nivel]` para ajustar volumen personalizado.',
            flags: 64
          });
          return;
      }
      
      const volumenAnterior = Math.round(queue.volume * 100);
      queue.volume = nuevoVolumen / 100;
      
      const updateEmbed = createEmbed({
        color: this.getVolumeColor(nuevoVolumen),
        title: '🔊 Volumen ajustado',
        description: `**${volumenAnterior}%** → **${nuevoVolumen}%**\n${this.getVolumeBar(nuevoVolumen)}`
      });
      
      updateEmbed.data.footer.text = `Ajustado por ${buttonInteraction.user.username}`;
      
      await buttonInteraction.update({ 
        embeds: [updateEmbed],
        components: [row, row2] 
      });
    });
    
    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  },

  getVolumeBar(volume) {
    const bars = 20;
    const filled = Math.round((volume / 200) * bars);
    const empty = bars - filled;
    
    let bar = '';
    if (volume === 0) {
      bar = '`[🔇────SILENCIADO────]`';
    } else if (volume <= 50) {
      bar = `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` (Bajo)`;
    } else if (volume <= 100) {
      bar = `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` (Normal)`;
    } else if (volume <= 150) {
      bar = `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` (Alto)`;
    } else {
      bar = `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` (⚠️ Muy alto)`;
    }
    
    return bar;
  },

  getVolumeColor(volume) {
    if (volume === 0) return 0x95A5A6; // Gris
    if (volume <= 50) return 0x3498DB; // Azul
    if (volume <= 100) return 0x2ECC71; // Verde
    if (volume <= 150) return 0xF39C12; // Naranja
    return 0xE74C3C; // Rojo
  }
};
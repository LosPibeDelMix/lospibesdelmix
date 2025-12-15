const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Configura el modo de repetición de la cola')
    .addStringOption(option =>
      option
        .setName('modo')
        .setDescription('Modo de repetición a activar')
        .setRequired(false)
        .addChoices(
          { name: '🔂 Repetir canción', value: 'track' },
          { name: '🔁 Repetir cola', value: 'queue' },
          { name: '⏭️ Repetir una vez', value: 'once' },
          { name: '❌ Desactivar repetición', value: 'off' }
        )
    ),

  async execute(interaction) {
    const queue = interaction.client.getQueue(interaction.guildId);
    const modo = interaction.options.getString('modo');
    
    if (!queue) {
      return interaction.reply({ 
        embeds: [createErrorEmbed(
          '❌ No hay cola activa',
          'No hay música reproduciéndose para configurar repetición.'
        )],
        ephemeral: true
      });
    }
    
    // Inicializar sistema de loop si no existe
    if (!queue.loopMode) {
      queue.loopMode = 'off';
      queue.loopCount = 0;
    }
    
    // Si no se especifica modo, mostrar selector
    if (!modo) {
      return this.showLoopSelector(interaction, queue);
    }
    
    // Aplicar modo seleccionado
    const modoAnterior = queue.loop || 0;
    queue.loop = modo === 'track' ? 1 : modo === 'queue' ? 2 : 0;
    
    const embed = createEmbed({
      color: this.getLoopColor(modo),
      title: this.getLoopTitle(modo),
      description: this.getLoopDescription(modo, queue),
      fields: [
        { name: '🔄 Modo anterior', value: `\`${this.getModeName(this.getModeFromLoop(modoAnterior))}\``, inline: true },
        { name: '🎯 Modo actual', value: `\`${this.getModeName(modo)}\``, inline: true },
        { name: '👤 Configurado por', value: interaction.user.toString(), inline: true }
      ]
    });
    
    embed.data.footer.text = this.getLoopFooter(modo);
    
    await interaction.reply({ embeds: [embed] });
  },

  async showLoopSelector(interaction, queue) {
    const currentMode = this.getModeFromLoop(queue.loop || 0);
    const embed = createEmbed({
      color: COLORS.info,
      title: '🔁 Configurar repetición',
      description: `Modo actual: **${this.getModeName(currentMode)}**\n\nSelecciona un modo de repetición:`,
      fields: [
        { 
          name: '🔂 Repetir canción', 
          value: 'La canción actual se repetirá infinitamente', 
          inline: false 
        },
        { 
          name: '🔁 Repetir cola', 
          value: 'Toda la cola se repetirá cuando termine', 
          inline: false 
        },
        { 
          name: '⏭️ Repetir una vez', 
          value: 'La canción actual se repetirá una vez más', 
          inline: false 
        },
        { 
          name: '❌ Desactivar', 
          value: 'Sin repetición (comportamiento normal)', 
          inline: false 
        }
      ]
    });
    
    embed.data.footer.text = `Canciones en cola: ${queue.songs.length}`;
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('loop_select')
      .setPlaceholder('Selecciona modo de repetición...')
      .addOptions([
        {
          label: 'Repetir canción',
          description: 'Canción actual en loop infinito',
          value: 'track',
          emoji: '🔂'
        },
        {
          label: 'Repetir cola',
          description: 'Toda la cola en loop',
          value: 'queue',
          emoji: '🔁'
        },
        {
          label: 'Repetir una vez',
          description: 'Canción actual se repite una vez',
          value: 'once',
          emoji: '⏭️'
        },
        {
          label: 'Desactivar repetición',
          description: 'Comportamiento normal',
          value: 'off',
          emoji: '❌'
        }
      ]);
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    const reply = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true 
    });
    
    const collector = reply.createMessageComponentCollector({ 
      time: 30000 
    });
    
    collector.on('collect', async (selectInteraction) => {
      if (selectInteraction.user.id !== interaction.user.id) {
        return selectInteraction.reply({ 
          content: '❌ Solo quien ejecutó el comando puede seleccionar.', 
          flags: 64 
        });
      }
      
      const modo = selectInteraction.values[0];
      const modoAnterior = queue.loop || 0;
      queue.loop = modo === 'track' ? 1 : modo === 'queue' ? 2 : 0;
      
      const resultEmbed = createEmbed({
        color: this.getLoopColor(modo),
        title: this.getLoopTitle(modo),
        description: `Modo cambiado: **${this.getModeName(this.getModeFromLoop(modoAnterior))}** → **${this.getModeName(modo)}**`,
        fields: [
          { name: '🎵 Canción actual', value: queue.songs[0] ? `[${queue.songs[0].title}](${queue.songs[0].url})` : 'Ninguna', inline: false },
          { name: '📋 Canciones en cola', value: `\`${queue.songs.length}\``, inline: true },
          { name: '👤 Configurado por', value: selectInteraction.user.toString(), inline: true }
        ]
      });
      
      resultEmbed.data.footer.text = this.getLoopFooter(modo);
      
      await selectInteraction.update({ 
        embeds: [resultEmbed], 
        components: [] 
      });
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        reply.edit({ 
          content: '⏰ **Selección cancelada por tiempo.**', 
          embeds: [], 
          components: [] 
        }).catch(() => {});
      }
    });
  },

  getModeName(mode) {
    switch (mode) {
      case 'track': return 'Repetir canción';
      case 'queue': return 'Repetir cola';
      case 'once': return 'Repetir una vez';
      default: return 'Desactivado';
    }
  },

  getLoopTitle(mode) {
    switch (mode) {
      case 'track': return '🔂 Repetición de canción activada';
      case 'queue': return '🔁 Repetición de cola activada';
      case 'once': return '⏭️ Repetición única activada';
      default: return '❌ Repetición desactivada';
    }
  },

  getLoopDescription(mode, queue) {
    switch (mode) {
      case 'track':
        return `**${queue.songs[0]?.title || 'Canción actual'}** se repetirá infinitamente.`;
      case 'queue':
        return `Las **${queue.songs.length}** canciones en cola se repetirán.`;
      case 'once':
        return `**${queue.songs[0]?.title || 'Canción actual'}** se repetirá una vez más.`;
      default:
        return 'Sin repetición. La cola avanzará normalmente.';
    }
  },

  getLoopFooter(mode) {
    switch (mode) {
      case 'track': return 'Puedes saltar manualmente para cambiar de canción';
      case 'queue': return 'La cola se reiniciará automáticamente';
      case 'once': return 'Después de la repetición, el loop se desactivará';
      default: return 'Usa /loop para activar la repetición nuevamente';
    }
  },

  getModeFromLoop(loopValue) {
    switch (loopValue) {
      case 1: return 'track';
      case 2: return 'queue';
      default: return 'off';
    }
  },

  getLoopColor(mode) {
    switch (mode) {
      case 'track': return COLORS.error;
      case 'queue': return COLORS.success;
      case 'once': return COLORS.warning;
      default: return COLORS.secondary;
    }
  }
};
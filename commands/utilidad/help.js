const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra ayuda sobre los comandos del bot')
    .addStringOption(option =>
      option.setName('comando')
        .setDescription('Comando específico para ver ayuda detallada')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const comandoEspecifico = interaction.options.getString('comando');
    
    if (comandoEspecifico) {
      return this.showCommandHelp(interaction, comandoEspecifico);
    }
    
    // Mostrar ayuda general
    const embed = createEmbed({
      color: COLORS.info,
      title: '🎵 Ayuda del Bot de Música',
      description: '**Comandos disponibles**\nSelecciona una categoría para ver más detalles:',
      thumbnail: interaction.client.user.displayAvatarURL(),
      fields: [
        { 
          name: '🎵 **Reproducción**', 
          value: '`/play`, `/search`, `/skip`, `/pause`, `/resume`, `/stop`', 
          inline: false 
        },
        { 
          name: '📋 **Gestión de Cola**', 
          value: '`/queue`, `/nowplaying`, `/shuffle`, `/loop`, `/clear`, `/volume`', 
          inline: false 
        },
        { 
          name: '🔧 **Utilidades**', 
          value: '`/debug`, `/fix`, `/ping`, `/help`, `/settings`', 
          inline: false 
        },
        { 
          name: '⚡ **Comandos Rápidos**', 
          value: '• `/play [canción]` - Reproduce música\n• `/skip` - Salta canción actual\n• `/queue` - Muestra la cola\n• `/volume [nivel]` - Ajusta volumen', 
          inline: false 
        }
      ]
    });
    
    embed.data.footer.text = `Total: ${interaction.client.commands.size} comandos • Usa /help [comando] para detalles`;
    
    // Menú de selección por categorías
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('Selecciona una categoría...')
      .addOptions([
        {
          label: '🎵 Reproducción',
          description: 'Comandos para reproducir y controlar música',
          value: 'playback',
          emoji: '🎵'
        },
        {
          label: '📋 Gestión de Cola',
          description: 'Comandos para manejar la cola de reproducción',
          value: 'queue',
          emoji: '📋'
        },
        {
          label: '🔧 Utilidades',
          description: 'Comandos de diagnóstico y utilidades',
          value: 'utilities',
          emoji: '🔧'
        },
        {
          label: '📖 Todos los Comandos',
          description: 'Ver lista completa de todos los comandos',
          value: 'all',
          emoji: '📖'
        }
      ]);
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    const reply = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true 
    });
    
    const collector = reply.createMessageComponentCollector({ 
      time: 60000 
    });
    
    collector.on('collect', async (selectInteraction) => {
      await selectInteraction.deferUpdate();
      
      let categoryEmbed;
      
      switch (selectInteraction.values[0]) {
        case 'playback':
          categoryEmbed = this.getPlaybackHelpEmbed();
          break;
        case 'queue':
          categoryEmbed = this.getQueueHelpEmbed();
          break;
        case 'utilities':
          categoryEmbed = this.getUtilitiesHelpEmbed();
          break;
        case 'all':
          categoryEmbed = this.getAllCommandsEmbed(interaction);
          break;
      }
      
      await selectInteraction.editReply({ 
        embeds: [categoryEmbed],
        components: [row] 
      });
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        reply.edit({ components: [] }).catch(() => {});
      }
    });
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const commands = Array.from(interaction.client.commands.keys());
    
    const filtered = commands
      .filter(choice => choice.toLowerCase().includes(focusedValue))
      .slice(0, 25)
      .map(choice => ({ name: `/${choice}`, value: choice }));
    
    await interaction.respond(filtered);
  },

  async showCommandHelp(interaction, commandName) {
    const command = interaction.client.commands.get(commandName);
    
    if (!command) {
      return interaction.reply({
        embeds: [createErrorEmbed(
          '❌ Comando no encontrado',
          `No se encontró el comando \`/${commandName}\`.`
        )],
        ephemeral: true
      });
    }
    
    const embed = createEmbed({
      color: COLORS.primary,
      title: `📖 Ayuda: /${command.data.name}`,
      description: command.data.description || 'Sin descripción',
      fields: [{
        name: '📝 Uso',
        value: this.getCommandUsage(command),
        inline: false
      }]
    });
    
    // Opciones del comando
    if (command.data.options && command.data.options.length > 0) {
      const optionsText = command.data.options.map(opt => {
        const required = opt.required ? ' (requerido)' : ' (opcional)';
        return `• **${opt.name}**${required}: ${opt.description}`;
      }).join('\n');
      
      embed.addFields({
        name: '⚙️ Opciones',
        value: optionsText,
        inline: false
      });
    }
    
    // Ejemplos de uso
    const examples = this.getCommandExamples(command);
    if (examples) {
      embed.addFields({
        name: '💡 Ejemplos',
        value: examples,
        inline: false
      });
    }
    
    // Notas adicionales
    const notes = this.getCommandNotes(command);
    if (notes) {
      embed.addFields({
        name: '📌 Notas',
        value: notes,
        inline: false
      });
    }
    
    embed.setFooter({ 
      text: `Categoría: ${this.getCommandCategory(command)} • Usa /help para volver al menú principal`,
      iconURL: interaction.user.displayAvatarURL()
    });
    
    await interaction.reply({ embeds: [embed] });
  },

  getCommandUsage(command) {
    let usage = `\`/${command.data.name}\``;
    
    if (command.data.options && command.data.options.length > 0) {
      const options = command.data.options.map(opt => {
        return opt.required ? `<${opt.name}>` : `[${opt.name}]`;
      }).join(' ');
      
      usage += ` ${options}`;
    }
    
    return usage;
  },

  getCommandExamples(command) {
    const examples = {
      'play': '• `/play never gonna give you up`\n• `/play https://youtube.com/watch?v=...`\n• `/play bohemian rhapsody --shuffle true`',
      'skip': '• `/skip`\n• `/skip 3` (salta 3 canciones)',
      'volume': '• `/volume` (muestra controles)\n• `/volume 75` (ajusta a 75%)',
      'queue': '• `/queue`\n• `/queue 2` (página 2)',
      'search': '• `/search queen`\n• `/search thriller michael jackson --resultados 8`',
      'debug': '• `/debug`\n• `/debug --tecnico true` (info detallada)'
    };
    
    return examples[command.data.name] || null;
  },

  getCommandNotes(command) {
    const notes = {
      'play': '• Puedes usar URLs de YouTube o nombres de canciones\n• Usa `/search` para ver resultados antes de añadir\n• Añade `--shuffle true` para mezclar después de añadir',
      'skip': '• Con múltiples usuarios, se activa sistema de votación\n• Puedes especificar cuántas canciones saltar',
      'volume': '• Rango: 0-200%\n• 0% = silencio, 100% = volumen normal\n• >150% puede causar distorsión',
      'fix': '• Analiza y repara problemas automáticamente\n• Usa opciones específicas para problemas concretos'
    };
    
    return notes[command.data.name] || null;
  },

  getCommandCategory(command) {
    const playback = ['play', 'skip', 'pause', 'resume', 'stop', 'search'];
    const queue = ['queue', 'nowplaying', 'shuffle', 'loop', 'clear', 'volume'];
    const utilities = ['debug', 'fix', 'ping', 'help', 'settings'];
    
    if (playback.includes(command.data.name)) return 'Reproducción';
    if (queue.includes(command.data.name)) return 'Gestión de Cola';
    if (utilities.includes(command.data.name)) return 'Utilidades';
    return 'General';
  },

  getPlaybackHelpEmbed() {
    return new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle('🎵 Comandos de Reproducción')
      .setDescription('Comandos para controlar la reproducción de música:')
      .addFields(
        { 
          name: '`/play [canción]`', 
          value: 'Reproduce música desde YouTube\nOpciones: `--shuffle`, `--posicion`', 
          inline: false 
        },
        { 
          name: '`/search [búsqueda]`', 
          value: 'Busca canciones y selecciona para añadir\nOpciones: `--resultados` (1-10)', 
          inline: false 
        },
        { 
          name: '`/skip [cantidad]`', 
          value: 'Salta la canción actual o varias\nCon múltiples usuarios: sistema de votación', 
          inline: false 
        },
        { 
          name: '`/pause`', 
          value: 'Pausa la reproducción actual', 
          inline: false 
        },
        { 
          name: '`/resume`', 
          value: 'Reanuda la reproducción pausada', 
          inline: false 
        },
        { 
          name: '`/stop`', 
          value: 'Detiene completamente y limpia la cola\nRequiere confirmación', 
          inline: false 
        }
      )
      .setFooter({ text: 'Usa /help [comando] para detalles específicos' });
  },

  getQueueHelpEmbed() {
    return new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('📋 Comandos de Gestión de Cola')
      .setDescription('Comandos para manejar la cola de reproducción:')
      .addFields(
        { 
          name: '`/queue [página]`', 
          value: 'Muestra la cola de reproducción\nSistema de paginación incluido', 
          inline: false 
        },
        { 
          name: '`/nowplaying [detallado]`', 
          value: 'Muestra información de la canción actual\nOpciones: `--detallado` (info técnica)', 
          inline: false 
        },
        { 
          name: '`/shuffle`', 
          value: 'Mezcla aleatoriamente las canciones en cola\nNecesita al menos 2 canciones', 
          inline: false 
        },
        { 
          name: '`/loop [modo]`', 
          value: 'Configura repetición de canción o cola\nModos: track, queue, once, off', 
          inline: false 
        },
        { 
          name: '`/clear [incluir_actual]`', 
          value: 'Limpia la cola (excepto canción actual)\nOpciones: `--incluir_actual`', 
          inline: false 
        },
        { 
          name: '`/volume [nivel]`', 
          value: 'Ajusta el volumen (0-200%)\nSin nivel: muestra controles interactivos', 
          inline: false 
        }
      )
      .setFooter({ text: 'Usa /help [comando] para detalles específicos' });
  },

  getUtilitiesHelpEmbed() {
    return new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('🔧 Comandos de Utilidades')
      .setDescription('Comandos de diagnóstico y utilidades del bot:')
      .addFields(
        { 
          name: '`/debug [tecnico]`', 
          value: 'Diagnóstico completo del sistema\nOpciones: `--tecnico` (info detallada)', 
          inline: false 
        },
        { 
          name: '`/fix [problema]`', 
          value: 'Repara problemas comunes automáticamente\nProblemas: no_audio, voice_connection, etc.', 
          inline: false 
        },
        { 
          name: '`/ping`', 
          value: 'Muestra latencias y estado del sistema', 
          inline: false 
        },
        { 
          name: '`/help [comando]`', 
          value: 'Muestra esta ayuda\nAutocompletado disponible', 
          inline: false 
        },
        { 
          name: '`/settings`', 
          value: 'Configura preferencias del bot (próximamente)', 
          inline: false 
        }
      )
      .setFooter({ text: 'Usa /help [comando] para detalles específicos' });
  },

  getAllCommandsEmbed(interaction) {
    const commands = Array.from(interaction.client.commands.values());
    
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('📖 Todos los Comandos Disponibles')
      .setDescription(`**${commands.length} comandos cargados:**`);
    
    // Agrupar por categoría
    const categories = {
      '🎵 Reproducción': [],
      '📋 Gestión de Cola': [],
      '🔧 Utilidades': []
    };
    
    commands.forEach(cmd => {
      const category = this.getCommandCategory(cmd);
      const entry = `\`/${cmd.data.name}\` - ${cmd.data.description.substring(0, 50)}...`;
      
      switch (category) {
        case 'Reproducción':
          categories['🎵 Reproducción'].push(entry);
          break;
        case 'Gestión de Cola':
          categories['📋 Gestión de Cola'].push(entry);
          break;
        case 'Utilidades':
          categories['🔧 Utilidades'].push(entry);
          break;
      }
    });
    
    // Añadir cada categoría como field
    Object.entries(categories).forEach(([category, cmdList]) => {
      if (cmdList.length > 0) {
        embed.addFields({
          name: category,
          value: cmdList.join('\n'),
          inline: false
        });
      }
    });
    
    embed.setFooter({ 
      text: `Usa /help [comando] para ver detalles específicos de cada comando`,
      iconURL: interaction.client.user.displayAvatarURL()
    });
    
    return embed;
  }
};
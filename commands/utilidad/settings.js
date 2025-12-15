const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configura preferencias del bot de música')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Ver configuración actual')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ajustar')
        .setDescription('Ajustar una configuración específica')
        .addStringOption(option =>
          option.setName('configuracion')
            .setDescription('Configuración a ajustar')
            .setRequired(true)
            .addChoices(
              { name: '🔊 Volumen por defecto', value: 'default_volume' },
              { name: '🎵 Reproducción automática', value: 'autoplay' },
              { name: '📋 Tamaño de página', value: 'page_size' },
              { name: '🔔 Notificaciones', value: 'notifications' },
              { name: '🎨 Color del bot', value: 'embed_color' }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'ver':
        await this.showSettings(interaction);
        break;
      case 'ajustar':
        await this.adjustSetting(interaction);
        break;
    }
  },

  async showSettings(interaction) {
    // Obtener configuración (simulada - en producción usaría base de datos)
    const settings = {
      default_volume: 80,
      autoplay: true,
      page_size: 10,
      notifications: true,
      embed_color: '#3498DB',
      language: 'es',
      prefix: '/',
      dj_role: null,
      max_queue_length: 100,
      vote_skip_percentage: 50
    };
    
    const embed = new EmbedBuilder()
      .setColor(settings.embed_color)
      .setTitle('⚙️ Configuración del Bot')
      .setDescription('Configuración actual para este servidor:')
      .addFields(
        { 
          name: '🎵 Reproducción', 
          value: `**Volumen por defecto:** \`${settings.default_volume}%\`\n**Reproducción automática:** ${settings.autoplay ? '✅' : '❌'}\n**Tamaño máximo de cola:** \`${settings.max_queue_length}\``, 
          inline: false 
        },
        { 
          name: '📱 Interfaz', 
          value: `**Tamaño de página:** \`${settings.page_size}\`\n**Color de embeds:** \`${settings.embed_color}\`\n**Notificaciones:** ${settings.notifications ? '✅' : '❌'}`, 
          inline: false 
        },
        { 
          name: '🔧 Sistema', 
          value: `**Idioma:** \`${settings.language}\`\n**Prefijo:** \`${settings.prefix}\`\n**% para saltar:** \`${settings.vote_skip_percentage}%\``, 
          inline: false 
        }
      )
      .setFooter({ 
        text: `Configuración del servidor: ${interaction.guild.name}`, 
        iconURL: interaction.guild.iconURL() 
      })
      .setTimestamp();
    
    // Menú para cambiar configuraciones
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('settings_select')
      .setPlaceholder('Cambiar configuración...')
      .addOptions([
        {
          label: '🔊 Volumen por defecto',
          description: `Actual: ${settings.default_volume}%`,
          value: 'change_default_volume',
          emoji: '🔊'
        },
        {
          label: '🎵 Reproducción automática',
          description: `Actual: ${settings.autoplay ? 'ON' : 'OFF'}`,
          value: 'change_autoplay',
          emoji: '🎵'
        },
        {
          label: '📋 Tamaño de página',
          description: `Actual: ${settings.page_size}`,
          value: 'change_page_size',
          emoji: '📋'
        },
        {
          label: '🔔 Notificaciones',
          description: `Actual: ${settings.notifications ? 'ON' : 'OFF'}`,
          value: 'change_notifications',
          emoji: '🔔'
        },
        {
          label: '🎨 Color del bot',
          description: `Actual: ${settings.embed_color}`,
          value: 'change_embed_color',
          emoji: '🎨'
        }
      ]);
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      flags: 64 
    });
  },

  async adjustSetting(interaction) {
    const setting = interaction.options.getString('configuracion');
    
    // Crear modal para entrada de valor
    const modal = new ModalBuilder()
      .setCustomId(`settings_modal_${setting}`)
      .setTitle(`Ajustar ${this.getSettingName(setting)}`);
    
    const input = new TextInputBuilder()
      .setCustomId('setting_value')
      .setLabel(this.getSettingLabel(setting))
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(this.getSettingPlaceholder(setting))
      .setRequired(true);
    
    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    
    await interaction.showModal(modal);
    
    // Manejar respuesta del modal
    try {
      const modalResponse = await interaction.awaitModalSubmit({
        time: 60000,
        filter: i => i.customId === `settings_modal_${setting}`
      });
      
      const value = modalResponse.fields.getTextInputValue('setting_value');
      
      // Validar y procesar el valor
      const validation = this.validateSetting(setting, value);
      
      if (!validation.valid) {
        return modalResponse.deferUpdate();
      }
      
      // Aquí guardarías en base de datos en producción
      const processedValue = validation.processedValue;
      
      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✅ Configuración actualizada')
        .setDescription(`**${this.getSettingName(setting)}** ha sido actualizado.`)
        .addFields(
          { name: 'Nuevo valor', value: `\`${processedValue}\``, inline: true },
          { name: 'Configurado por', value: interaction.user.toString(), inline: true }
        )
        .setFooter({ text: 'Los cambios pueden requerir reinicio para aplicar completamente' })
        .setTimestamp();
      
      await modalResponse.update({ embeds: [embed], flags: 64 });      
    } catch (error) {
      // Timeout del modal
      if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
        await interaction.followUp({
          content: '⏰ Configuración cancelada por tiempo.',
          flags: 64
        });
      }
    }
  },

  getSettingName(setting) {
    const names = {
      'default_volume': 'Volumen por defecto',
      'autoplay': 'Reproducción automática',
      'page_size': 'Tamaño de página',
      'notifications': 'Notificaciones',
      'embed_color': 'Color del bot'
    };
    
    return names[setting] || setting;
  },

  getSettingLabel(setting) {
    const labels = {
      'default_volume': 'Nuevo volumen (0-200%)',
      'autoplay': 'Activar reproducción automática? (true/false)',
      'page_size': 'Nuevo tamaño de página (5-25)',
      'notifications': 'Activar notificaciones? (true/false)',
      'embed_color': 'Nuevo color (hex, ej: #3498DB)'
    };
    
    return labels[setting] || 'Nuevo valor';
  },

  getSettingPlaceholder(setting) {
    const placeholders = {
      'default_volume': 'Ej: 80',
      'autoplay': 'Ej: true',
      'page_size': 'Ej: 10',
      'notifications': 'Ej: false',
      'embed_color': 'Ej: #1DB954'
    };
    
    return placeholders[setting] || 'Introduce el nuevo valor';
  },

  validateSetting(setting, value) {
    switch (setting) {
      case 'default_volume':
        const volume = parseInt(value);
        if (isNaN(volume) || volume < 0 || volume > 200) {
          return { valid: false, error: 'Debe ser un número entre 0 y 200' };
        }
        return { valid: true, processedValue: `${volume}%` };
        
      case 'autoplay':
        const autoplay = value.toLowerCase();
        if (!['true', 'false', 'yes', 'no', 'on', 'off'].includes(autoplay)) {
          return { valid: false, error: 'Debe ser true/false, yes/no, on/off' };
        }
        const boolValue = ['true', 'yes', 'on'].includes(autoplay);
        return { valid: true, processedValue: boolValue ? 'Activado' : 'Desactivado' };
        
      case 'page_size':
        const size = parseInt(value);
        if (isNaN(size) || size < 5 || size > 25) {
          return { valid: false, error: 'Debe ser un número entre 5 y 25' };
        }
        return { valid: true, processedValue: size };
        
      case 'notifications':
        const notifications = value.toLowerCase();
        if (!['true', 'false', 'yes', 'no', 'on', 'off'].includes(notifications)) {
          return { valid: false, error: 'Debe ser true/false, yes/no, on/off' };
        }
        const notifValue = ['true', 'yes', 'on'].includes(notifications);
        return { valid: true, processedValue: notifValue ? 'Activadas' : 'Desactivadas' };
        
      case 'embed_color':
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(value)) {
          return { valid: false, error: 'Debe ser un color hexadecimal válido (ej: #3498DB)' };
        }
        return { valid: true, processedValue: value };
        
      default:
        return { valid: true, processedValue: value };
    }
  }
};
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { execSync } = require('child_process');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Diagnóstico completo del sistema del bot')
    .addBooleanOption(option =>
      option.setName('tecnico')
        .setDescription('Mostrar información técnica detallada')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    
    const tecnico = interaction.options.getBoolean('tecnico') || false;
    const report = [];
    
    // 1. Información del sistema
    report.push('## 🖥️ **INFORMACIÓN DEL SISTEMA**');
    report.push(`- **Plataforma:** \`${process.platform} ${process.arch}\``);
    report.push(`- **Node.js:** \`${process.version}\``);
    report.push(`- **Uptime:** \`${Math.floor(process.uptime() / 60)} minutos\``);
    report.push(`- **Memoria:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``);
    
    if (tecnico) {
      report.push(`- **CPU:** \`${os.cpus()[0].model.substring(0, 40)}\``);
      report.push(`- **OS:** \`${os.type()} ${os.release()}\``);
    }
    
    // 2. Dependencias del sistema
    report.push('\n## 📦 **DEPENDENCIAS DEL SISTEMA**');
    
    const dependencies = {
      'FFmpeg': { command: 'ffmpeg -version 2>&1 | head -1', timeout: 3000 },
      'yt-dlp': { command: 'yt-dlp --version', timeout: 3000 },
      'Python': { command: 'python --version 2>&1 || python3 --version 2>&1', timeout: 3000 },
      'PIP': { command: 'pip --version 2>&1 || pip3 --version 2>&1', timeout: 3000 }
    };
    
    for (const [name, config] of Object.entries(dependencies)) {
      try {
        const result = execSync(config.command, { 
          timeout: config.timeout,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        }).toString().trim();
        report.push(`- **${name}:** ✅ \`${result.substring(0, 60)}\``);
      } catch (error) {
        report.push(`- **${name}:** ❌ NO INSTALADO`);
      }
    }
    
    // 3. Dependencias Node.js
    report.push('\n## 📦 **DEPENDENCIAS NODE.JS**');
    
    const nodeDeps = ['@discordjs/opus', 'discord.js', '@discordjs/voice', 'yt-search'];
    for (const dep of nodeDeps) {
      try {
        const pkg = require(`${dep}/package.json`);
        report.push(`- **${dep}:** ✅ v${pkg.version}`);
      } catch {
        report.push(`- **${dep}:** ❌ NO INSTALADO`);
      }
    }
    
    // 4. Estado del bot
    report.push('\n## 🤖 **ESTADO DEL BOT**');
    report.push(`- **Servidores:** \`${interaction.client.guilds.cache.size}\``);
    report.push(`- **Comandos cargados:** \`${interaction.client.commands.size}\``);
    report.push(`- **Latencia API:** \`${interaction.client.ws.ping}ms\``);
    report.push(`- **Usuarios totales:** \`${interaction.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString()}\``);
    
    // 5. Estado del servidor actual
    report.push('\n## 🏠 **ESTADO DEL SERVIDOR ACTUAL**');
    
    const queue = interaction.client.getQueue(interaction.guildId);
    if (queue) {
      const estado = queue.getStatus();
      report.push(`- **Cola activa:** ✅ SÍ`);
      report.push(`- **Canciones en cola:** \`${estado.queueLength}\``);
      report.push(`- **Reproduciendo:** ${estado.playing ? '✅ SÍ' : '❌ NO'}`);
      report.push(`- **Estado conexión:** \`${estado.connectionStatus}\``);
      report.push(`- **Estado player:** \`${estado.playerStatus}\``);
      report.push(`- **Reintentos:** \`${estado.retryCount}/3\``);
      report.push(`- **Volumen:** \`${estado.volume}%\``);
      
      if (estado.lastError) {
        report.push(`- **Último error:** \`${estado.lastError.message.substring(0, 80)}\``);
        report.push(`- **Hora error:** \`${new Date(estado.lastError.time).toLocaleTimeString()}\``);
        report.push(`- **Código error:** \`${estado.lastError.code || 'N/A'}\``);
      }
      
      if (tecnico && estado.isStreaming) {
        report.push(`- **Stream activo:** ✅ SÍ`);
      }
    } else {
      report.push('- **Cola activa:** ❌ NO');
    }
    
    // 6. Permisos de voz
    report.push('\n## 🔐 **PERMISOS EN CANAL DE VOZ**');
    
    const voiceChannel = interaction.member?.voice?.channel;
    if (voiceChannel) {
      const permissions = voiceChannel.permissionsFor(interaction.client.user);
      report.push(`- **Canal:** \`${voiceChannel.name}\``);
      report.push(`- **Conectar:** ${permissions.has('Connect') ? '✅' : '❌'}`);
      report.push(`- **Hablar:** ${permissions.has('Speak') ? '✅' : '❌'}`);
      report.push(`- **Ver canal:** ${permissions.has('ViewChannel') ? '✅' : '❌'}`);
      report.push(`- **Miembros en canal:** \`${voiceChannel.members.filter(m => !m.user.bot).size}\``);
    } else {
      report.push('- **Usuario no está en canal de voz**');
    }
    
    // 7. Problemas comunes detectados
    report.push('\n## 🔍 **PROBLEMAS DETECTADOS**');
    
    const problemas = [];
    
    // Verificar FFmpeg
    try {
      execSync('ffmpeg -version', { timeout: 2000 });
    } catch {
      problemas.push('FFmpeg no está instalado o no está en PATH');
    }
    
    // Verificar yt-dlp
    try {
      execSync('yt-dlp --version', { timeout: 2000 });
    } catch {
      problemas.push('yt-dlp no está instalado o no está en PATH');
    }
    
    // Verificar permisos
    if (voiceChannel) {
      const perms = voiceChannel.permissionsFor(interaction.client.user);
      if (!perms.has('Connect')) problemas.push('Falta permiso CONECTAR en canal de voz');
      if (!perms.has('Speak')) problemas.push('Falta permiso HABLAR en canal de voz');
    }
    
    // Verificar memoria
    if ((process.memoryUsage().heapUsed / 1024 / 1024) > 500) {
      problemas.push('Uso de memoria alto (>500MB)');
    }
    
    if (problemas.length > 0) {
      problemas.forEach(p => report.push(`- ❌ ${p}`));
    } else {
      report.push('- ✅ No se detectaron problemas críticos');
    }
    
    // 8. Recomendaciones
    report.push('\n## 💡 **RECOMENDACIONES**');
    
    if (problemas.length > 0) {
      if (problemas.some(p => p.includes('FFmpeg'))) {
        report.push('1. **Instala FFmpeg:** `sudo apt install ffmpeg` (Linux) o descarga de ffmpeg.org (Windows)');
      }
      if (problemas.some(p => p.includes('yt-dlp'))) {
        report.push('2. **Instala yt-dlp:** `pip install yt-dlp`');
      }
      if (problemas.some(p => p.includes('permiso'))) {
        report.push('3. **Verifica permisos del bot** en la configuración del servidor');
      }
    } else {
      report.push('1. ✅ El sistema parece funcionar correctamente');
    }
    
    report.push('4. **Para errores EPIPE:** El bot se recupera automáticamente');
    report.push('5. **Actualiza regularmente:** `npm update && pip install -U yt-dlp`');
    report.push('6. **Usa /fix** para reparación automática de problemas');
    
    // Crear embed
    const embed = new EmbedBuilder()
      .setColor(problemas.length > 0 ? 0xE74C3C : 0x2ECC71)
      .setTitle(`🔍 DIAGNÓSTICO DEL SISTEMA ${problemas.length > 0 ? '(CON PROBLEMAS)' : '(ESTABLE)'}`)
      .setDescription(report.join('\n'))
      .setFooter({ 
        text: `Solicitado por ${interaction.user.tag} • ${new Date().toLocaleString()}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();
    
    // Botones de acción
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('debug_fix')
          .setLabel('🔧 Ejecutar reparación')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🛠️'),
        new ButtonBuilder()
          .setCustomId('debug_refresh')
          .setLabel('🔄 Actualizar diagnóstico')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔁'),
        new ButtonBuilder()
          .setCustomId('debug_export')
          .setLabel('📋 Exportar informe')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💾')
      );
    
    const reply = await interaction.editReply({ 
      embeds: [embed], 
      components: problemas.length > 0 ? [row] : []
    });
    
    if (problemas.length > 0) {
      const collector = reply.createMessageComponentCollector({ 
        time: 60000 
      });
      
      collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.user.id !== interaction.user.id) {
          return buttonInteraction.reply({ 
            content: '❌ Solo quien ejecutó el comando puede usar estos botones.', 
            flags: 64 
          });
        }
        
        if (buttonInteraction.customId === 'debug_fix') {
          // Ejecutar comando fix
          const fixCmd = interaction.client.commands.get('fix');
          if (fixCmd) {
            await buttonInteraction.deferUpdate();
            await fixCmd.execute(interaction);
          }
        } else if (buttonInteraction.customId === 'debug_refresh') {
          await buttonInteraction.deferUpdate();
          await this.execute(interaction);
        } else if (buttonInteraction.customId === 'debug_export') {
          // Exportar informe a texto
          const exportText = `=== DIAGNÓSTICO BOT DE MÚSICA ===\n${report.join('\n')}\n\nGenerado: ${new Date().toISOString()}`;
          
          await buttonInteraction.reply({
            content: '📋 **Informe exportado:**',
            files: [{
              attachment: Buffer.from(exportText, 'utf8'),
              name: `diagnostico-bot-${new Date().toISOString().slice(0, 10)}.txt`
            }],
            flags: 64
          });
        }
      });
      
      collector.on('end', () => {
        reply.edit({ components: [] }).catch(() => {});
      });
    }
  }
};
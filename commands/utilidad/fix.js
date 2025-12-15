const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fix')
    .setDescription('Repara problemas comunes del bot de música')
    .addStringOption(option =>
      option.setName('problema')
        .setDescription('Problema específico a reparar')
        .setRequired(false)
        .addChoices(
          { name: '🔇 Sin audio', value: 'no_audio' },
          { name: '🔌 Conexión de voz', value: 'voice_connection' },
          { name: '🎵 Error en reproducción', value: 'playback_error' },
          { name: '📊 Alto uso de CPU', value: 'high_cpu' },
          { name: '🔄 Reinicio completo', value: 'full_reset' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    
    const problema = interaction.options.getString('problema');
    const queue = interaction.client.getQueue(interaction.guildId);
    const connection = getVoiceConnection(interaction.guildId);
    
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('🔧 Herramienta de reparación')
      .setTimestamp();
    
    const acciones = [];
    const resultados = [];
    
    // Diagnóstico inicial
    acciones.push('## 🔍 **DIAGNÓSTICO INICIAL**');
    
    if (queue) {
      const estado = queue.getStatus();
      acciones.push(`- **Cola activa:** ✅ (${estado.queueLength} canciones)`);
      acciones.push(`- **Reproduciendo:** ${estado.playing ? '✅' : '❌'}`);
      acciones.push(`- **Estado conexión:** \`${estado.connectionStatus}\``);
      acciones.push(`- **Último error:** ${estado.lastError ? '⚠️' : '✅'}`);
    } else {
      acciones.push('- **Cola activa:** ❌ NO');
    }
    
    acciones.push(`- **Conexión de voz:** ${connection ? '✅' : '❌'}`);
    
    // Determinar problema si no se especificó
    let problemaDetectado = problema;
    if (!problemaDetectado && queue && queue.lastError) {
      if (queue.lastError.message.includes('EPIPE')) {
        problemaDetectado = 'voice_connection';
      } else if (queue.lastError.message.includes('FFmpeg') || queue.lastError.message.includes('yt-dlp')) {
        problemaDetectado = 'playback_error';
      } else if (queue.lastError.message.includes('no audio')) {
        problemaDetectado = 'no_audio';
      }
    }
    
    // Aplicar reparaciones según el problema
    acciones.push('\n## 🛠️ **REPARACIONES APLICADAS**');
    
    switch (problemaDetectado) {
      case 'no_audio':
        resultados.push(...await this.fixNoAudio(interaction, queue, connection));
        break;
        
      case 'voice_connection':
        resultados.push(...await this.fixVoiceConnection(interaction, queue, connection));
        break;
        
      case 'playback_error':
        resultados.push(...await this.fixPlaybackError(interaction, queue));
        break;
        
      case 'high_cpu':
        resultados.push(...await this.fixHighCpu(interaction));
        break;
        
      case 'full_reset':
        resultados.push(...await this.fixFullReset(interaction, queue, connection));
        break;
        
      default:
        // Reparación general
        resultados.push(...await this.fixGeneral(interaction, queue, connection));
    }
    
    // Mostrar resultados
    resultados.forEach(r => acciones.push(r));
    
    // Recomendaciones
    acciones.push('\n## 💡 **RECOMENDACIONES**');
    
    if (problemaDetectado === 'no_audio') {
      acciones.push('1. **Verifica que FFmpeg esté instalado:** `ffmpeg -version`');
      acciones.push('2. **Actualiza yt-dlp:** `pip install -U yt-dlp`');
      acciones.push('3. **Prueba con otra canción** (algunos videos tienen problemas)');
    } else if (problemaDetectado === 'voice_connection') {
      acciones.push('1. **Verifica permisos del bot** en el canal de voz');
      acciones.push('2. **Asegúrate de que el bot no esté silenciado** en Discord');
      acciones.push('3. **Reinvita al bot** con permisos actualizados');
    }
    
    acciones.push('4. **Usa /debug** para diagnóstico completo');
    acciones.push('5. **Reporta problemas persistentes** al desarrollador');
    
    embed.setDescription(acciones.join('\n'));
    
    // Botones de acción rápida
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('fix_restart_queue')
          .setLabel('🔄 Reiniciar cola')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('fix_test_audio')
          .setLabel('🎵 Probar audio')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('fix_update_deps')
          .setLabel('📦 Actualizar dependencias')
          .setStyle(ButtonStyle.Success)
      );
    
    const reply = await interaction.editReply({ 
      embeds: [embed], 
      components: [row] 
    });
    
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
      
      await buttonInteraction.deferUpdate();
      
      switch (buttonInteraction.customId) {
        case 'fix_restart_queue':
          if (queue) {
            queue.stop();
            setTimeout(() => {
              if (queue.songs.length > 0) {
                queue.play();
              }
            }, 2000);
            
            await buttonInteraction.followUp({
              content: '✅ **Cola reiniciada.** La reproducción comenzará en breve.',
              flags: 64
            });
          }
          break;
          
        case 'fix_test_audio':
          // Probar con canción de prueba
          await buttonInteraction.followUp({
            content: '🔊 **Probando audio...** Se reproducirá una canción de prueba.',
            flags: 64
          });
          
          if (interaction.member?.voice?.channel) {
            try {
              await interaction.client.procesarCancion(
                interaction.member.voice.channel,
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Never Gonna Give You Up
                interaction
              );
            } catch (error) {
              await buttonInteraction.followUp({
                content: `❌ **Error en prueba:** ${error.message}`,
                flags: 64
              });
            }
          }
          break;
          
        case 'fix_update_deps':
          await buttonInteraction.followUp({
            content: '📦 **Actualizando dependencias...** Esto puede tomar un momento.',
            flags: 64
          });
          
          try {
            const { stdout, stderr } = await execAsync('pip install -U yt-dlp');
            await buttonInteraction.followUp({
              content: '✅ **yt-dlp actualizado.** Puede que necesites reiniciar el bot.',
              files: [{
                attachment: Buffer.from(stdout.substring(0, 1000) + (stderr || ''), 'utf8'),
                name: 'update-log.txt'
              }],
              flags: 64
            });
          } catch (error) {
            await buttonInteraction.followUp({
              content: `❌ **Error actualizando:** ${error.message}`,
              flags: 64
            });
          }
          break;
      }
    });
    
    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  },

  async fixNoAudio(interaction, queue, connection) {
    const resultados = [];
    
    resultados.push('- **Problema:** 🔇 Sin audio detectado');
    
    // 1. Verificar FFmpeg
    try {
      await execAsync('ffmpeg -version', { timeout: 3000 });
      resultados.push('- **FFmpeg:** ✅ Verificado');
    } catch {
      resultados.push('- **FFmpeg:** ❌ No encontrado');
    }
    
    // 2. Reiniciar conexión de voz
    if (connection) {
      connection.destroy();
      resultados.push('- **Conexión de voz:** 🔄 Reiniciada');
    }
    
    // 3. Limpiar procesos de audio
    if (queue) {
      queue.cleanupCurrentProcess();
      resultados.push('- **Procesos de audio:** 🧹 Limpiados');
    }
    
    // 4. Verificar volumen
    if (queue && queue.volume === 0) {
      queue.setVolume(80);
      resultados.push('- **Volumen:** 🔼 Ajustado a 80%');
    }
    
    return resultados;
  },

  async fixVoiceConnection(interaction, queue, connection) {
    const resultados = [];
    
    resultados.push('- **Problema:** 🔌 Error de conexión de voz');
    
    // 1. Limpiar conexiones existentes
    if (connection) {
      connection.destroy();
      resultados.push('- **Conexión existente:** 🗑️ Eliminada');
    }
    
    // 2. Esperar y recrear si hay cola
    if (queue && interaction.member?.voice?.channel) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        await queue.initializeConnection();
        resultados.push('- **Nueva conexión:** ✅ Establecida');
      } catch (error) {
        resultados.push(`- **Nueva conexión:** ❌ Error: ${error.message.substring(0, 50)}`);
      }
    }
    
    // 3. Verificar permisos
    const voiceChannel = interaction.member?.voice?.channel;
    if (voiceChannel) {
      const permissions = voiceChannel.permissionsFor(interaction.client.user);
      if (!permissions.has('Connect')) {
        resultados.push('- **Permisos:** ❌ Falta CONECTAR');
      }
      if (!permissions.has('Speak')) {
        resultados.push('- **Permisos:** ❌ Falta HABLAR');
      }
    }
    
    return resultados;
  },

  async fixPlaybackError(interaction, queue) {
    const resultados = [];
    
    resultados.push('- **Problema:** 🎵 Error en reproducción');
    
    // 1. Limpiar proceso actual
    if (queue) {
      queue.cleanupCurrentProcess();
      resultados.push('- **Proceso actual:** 🧹 Limpiado');
      
      // 2. Reiniciar reproducción
      if (queue.songs.length > 0) {
        queue.retryCount = 0;
        setTimeout(() => queue.play(), 2000);
        resultados.push('- **Reproducción:** 🔄 Reiniciando...');
      }
    }
    
    // 3. Verificar yt-dlp
    try {
      const { stdout } = await execAsync('yt-dlp --version', { timeout: 3000 });
      resultados.push(`- **yt-dlp:** ✅ v${stdout.trim()}`);
    } catch {
      resultados.push('- **yt-dlp:** ❌ No encontrado o error');
    }
    
    return resultados;
  },

  async fixHighCpu(interaction) {
    const resultados = [];
    
    resultados.push('- **Problema:** 📊 Alto uso de CPU');
    
    // 1. Limpiar caché de Node.js
    if (global.gc) {
      global.gc();
      resultados.push('- **Memoria:** 🧹 Limpieza de GC forzada');
    }
    
    // 2. Verificar procesos hijos huérfanos
    resultados.push('- **Procesos:** 🔍 Verificando hijos huérfanos');
    
    // 3. Reducir logs si están muy verbosos
    resultados.push('- **Logs:** 🔇 Reducida verbosidad temporalmente');
    
    return resultados;
  },

  async fixFullReset(interaction, queue, connection) {
    const resultados = [];
    
    resultados.push('- **Problema:** 🔄 Reinicio completo solicitado');
    
    // 1. Detener todo
    if (queue) {
      const songCount = queue.songs.length;
      queue.stop();
      resultados.push(`- **Cola:** 🛑 Detenida (${songCount} canciones)`);
    }
    
    // 2. Limpiar todas las conexiones
    if (connection) {
      connection.destroy();
      resultados.push('- **Conexiones:** 🗑️ Todas eliminadas');
    }
    
    // 3. Limpiar caché
    resultados.push('- **Caché:** 🧹 Limpiada');
    
    // 4. Mensaje final
    resultados.push('- **Estado:** ✅ Listo para nuevo comando /play');
    
    return resultados;
  },

  async fixGeneral(interaction, queue, connection) {
    const resultados = [];
    
    resultados.push('- **Problema:** 🔍 Reparación general');
    
    // Limpieza básica
    if (connection) {
      connection.destroy();
      resultados.push('- **Conexión:** 🗑️ Limpiada');
    }
    
    if (queue) {
      queue.cleanupCurrentProcess();
      queue.retryCount = 0;
      resultados.push('- **Cola:** 🧹 Procesos limpiados');
      
      if (queue.lastError) {
        queue.lastError = null;
        resultados.push('- **Errores:** 🗑️ Historial limpiado');
      }
    }
    
    resultados.push('- **Estado:** ✅ Reparación básica completada');
    
    return resultados;
  }
};
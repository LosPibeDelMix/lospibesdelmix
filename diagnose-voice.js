require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

console.log('🔍 DIAGNÓSTICO DE CONEXIÓN DE VOZ\n');

client.once('ready', async () => {
  console.log(`✅ Bot: ${client.user.tag}`);
  
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log('❌ No hay servidores');
    process.exit(1);
  }
  
  console.log(`🏠 Servidor: ${guild.name}`);
  
  // Listar canales de voz
  const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased());
  console.log(`🎯 Canales de voz: ${voiceChannels.size}`);
  
  // Probar conexión manual
  const testChannel = voiceChannels.first();
  if (testChannel) {
    console.log(`\n🧪 Probando conexión a: #${testChannel.name}`);
    
    try {
      const connection = joinVoiceChannel({
        channelId: testChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });
      
      console.log('✅ Conexión creada, esperando estado Ready...');
      
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
      console.log('🎉 ¡CONEXIÓN DE VOZ EXITOSA!');
      
      // Desconectar
      setTimeout(() => {
        connection.destroy();
        console.log('🔌 Desconectado. Diagnóstico COMPLETADO.');
        console.log('\n💡 CONCLUSIÓN: @discordjs/voice FUNCIONA');
        console.log('💡 El problema está en DisTube o su configuración.');
        process.exit(0);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      console.log('\n💡 PROBLEMAS DETECTADOS:');
      console.log('1. Permisos del bot insuficientes');
      console.log('2. Firewall bloqueando puertos UDP (50,000-65,535)');
      console.log('3. Antivirus interfiriendo');
      process.exit(1);
    }
  } else {
    console.log('❌ No hay canales de voz para probar');
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log(`✅ Bot listo: ${client.user.tag}`);
  
  // Obtener un servidor (ajusta el ID)
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log('❌ No hay servidores disponibles');
    process.exit(1);
  }
  
  console.log(`🏠 Servidor: ${guild.name}`);
  
  // Intentar conectar a un canal de voz (si existe uno)
  const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased());
  console.log(`🎯 Canales de voz disponibles: ${voiceChannels.size}`);
  
  voiceChannels.forEach(channel => {
    console.log(`   #${channel.name} (${channel.id})`);
  });
  
  console.log('\n📌 Prueba manual:');
  console.log('1. Entra a un canal de voz en Discord');
  console.log('2. Usa el comando /play con una URL de YouTube');
  console.log('3. Si falla, verifica permisos del bot');
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
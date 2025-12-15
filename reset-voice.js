require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

console.log('🔄 Conectando para limpiar conexiones de voz...');

client.once('ready', async () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
  
  // Limpiar todas las conexiones de voz
  let cleaned = 0;
  
  for (const [guildId, guild] of client.guilds.cache) {
    const voiceAdapter = client.voice?.adapters?.get(guildId);
    if (voiceAdapter) {
      console.log(`   🧹 Limpiando conexión en servidor: ${guild.name}`);
      voiceAdapter.destroy();
      cleaned++;
    }
  }
  
  console.log(`\n🎯 Total conexiones limpiadas: ${cleaned}`);
  console.log('✅ Bot listo para una nueva conexión limpia.');
  console.log('⚠️  Cierra este proceso con Ctrl+C y reinicia tu bot principal.');
  
  // Mantener vivo por 10 segundos
  setTimeout(() => {
    console.log('⏰ Cerrando limpiador...');
    process.exit(0);
  }, 10000);
});

client.login(process.env.DISCORD_TOKEN);
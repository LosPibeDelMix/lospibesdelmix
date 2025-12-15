require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

console.log('🔄 Probando conexión...');

client.once('ready', () => {
  console.log('✅ Token válido! Bot conectado como:', client.user.tag);
  process.exit(0);
});

client.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Timeout - No se pudo conectar en 10 segundos');
  process.exit(1);
}, 10000);

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Error de login:', error.message);
  process.exit(1);
});
require('dotenv').config();
const { version: nodeVersion } = process;

console.log('🔍 VERIFICACIÓN FINAL DEL SISTEMA\n');

console.log('📊 VERSIONES:');
console.log(`   Node.js: ${nodeVersion}`);

try {
  const discordjs = require('discord.js');
  console.log(`   discord.js: ${discordjs.version}`);
} catch { console.log('   discord.js: ❌ No instalado') }

try {
  const voice = require('@discordjs/voice');
  console.log(`   @discordjs/voice: ${voice.version}`);
} catch { console.log('   @discordjs/voice: ❌ No instalado') }

try {
  const distube = require('distube');
  console.log(`   distube: ${distube.version}`);
} catch { console.log('   distube: ❌ No instalado') }

try {
  require('ffmpeg-static');
  console.log(`   ffmpeg-static: ✅ Instalado`);
} catch { console.log('   ffmpeg-static: ❌ No instalado') }

console.log('\n🌐 VARIABLES DE ENTORNO:');
console.log(`   DISCORD_TOKEN: ${process.env.DISCORD_TOKEN ? '✅ Sí' : '❌ No'}`);
console.log(`   CLIENT_ID: ${process.env.CLIENT_ID ? '✅ Sí' : '❌ No'}`);

console.log('\n🎯 RECOMENDACIÓN FINAL:');
console.log('Si @discordjs/voice es menor a 1.0.0, EJECUTA:');
console.log('   npm install @discordjs/voice@latest --legacy-peer-deps');
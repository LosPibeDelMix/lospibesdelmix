console.log('🔍 VERIFICACIÓN COMPLETA DE DEPENDENCIAS\n');

const deps = [
  { name: 'discord.js', required: true },
  { name: '@discordjs/voice', required: true },
  { name: '@snazzah/davey', required: true },
  { name: 'distube', required: true },
  { name: 'dotenv', required: true },
  { name: 'ffmpeg-static', required: true },
  { name: 'libsodium-wrappers', required: false },
  { name: 'tweetnacl', required: false },
];

let missing = [];
let installed = [];

deps.forEach(dep => {
  try {
    const pkg = require(dep.name);
    let version = '?';
    
    try {
      version = require(`${dep.name}/package.json`).version;
    } catch {}
    
    console.log(`✅ ${dep.name}: v${version}`);
    installed.push(dep.name);
    
  } catch (error) {
    console.log(`❌ ${dep.name}: ${dep.required ? 'FALTANTE' : 'Opcional'}`);
    if (dep.required) missing.push(dep.name);
  }
});

console.log('\n📊 RESUMEN:');
console.log(`   Instaladas: ${installed.length}/${deps.length}`);
console.log(`   Faltantes: ${missing.length}`);

if (missing.length > 0) {
  console.log('\n🚨 DEPENDENCIAS FALTANTES:');
  missing.forEach(dep => {
    console.log(`   npm install ${dep} --legacy-peer-deps`);
  });
}

// Verificar Node.js
console.log(`\n💻 Node.js: ${process.version}`);
console.log(`📁 Directorio: ${process.cwd()}`);

// Verificar .env básico
console.log('\n🔐 Variables .env:');
['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'].forEach(key => {
  console.log(`   ${key}: ${process.env[key] ? '✅' : '❌'}`);
});
// ============================================
// SCRIPT DE DIAGNÓSTICO - LOS PIBES DEL MIX
// ============================================

console.log('🔍 DIAGNÓSTICO DEL BOT DE MÚSICA');
console.log('='.repeat(50));

let errores = [];
let advertencias = [];

// ============================================
// 1. VERIFICAR NODE.JS
// ============================================
console.log('\n📦 Node.js:');
const nodeVersion = process.version;
console.log(`   Versión: ${nodeVersion}`);

const major = parseInt(nodeVersion.slice(1).split('.')[0]);
if (major < 16) {
  errores.push('Node.js debe ser v16 o superior');
} else {
  console.log('   ✅ Versión compatible');
}

// ============================================
// 2. VERIFICAR DEPENDENCIAS
// ============================================
console.log('\n📚 Dependencias:');

const dependencias = [
  'discord.js',
  'distube',
  '@distube/yt-dlp',
  'yt-search',
  'dotenv'
];

for (const dep of dependencias) {
  try {
    const pkg = require(dep);
    let version = 'desconocida';
    
    // Obtener versión
    try {
      if (dep === 'discord.js') {
        version = require('discord.js').version;
      } else if (dep === 'distube') {
        version = require('distube/package.json').version;
      } else {
        version = require(`${dep}/package.json`).version;
      }
    } catch {}
    
    console.log(`   ✅ ${dep} (${version})`);
  } catch (error) {
    console.log(`   ❌ ${dep} - NO INSTALADO`);
    errores.push(`Falta instalar: ${dep}`);
  }
}

// ============================================
// 3. VERIFICAR .ENV
// ============================================
console.log('\n🔐 Archivo .env:');

try {
  require('dotenv').config();
  
  if (process.env.DISCORD_TOKEN) {
    console.log(`   ✅ DISCORD_TOKEN encontrado`);
    console.log(`   📏 Longitud: ${process.env.DISCORD_TOKEN.length} caracteres`);
    
    if (process.env.DISCORD_TOKEN.length < 50) {
      advertencias.push('El token parece demasiado corto');
    }
  } else {
    console.log(`   ❌ DISCORD_TOKEN no encontrado`);
    errores.push('Falta DISCORD_TOKEN en .env');
  }
} catch (error) {
  console.log(`   ❌ Error leyendo .env: ${error.message}`);
  errores.push('No se puede leer el archivo .env');
}

// ============================================
// 4. PROBAR DISTUBE
// ============================================
console.log('\n🎵 DisTube:');

try {
  const { DisTube } = require('distube');
  const { YtDlpPlugin } = require('@distube/yt-dlp');
  const { Client, GatewayIntentBits } = require('discord.js');
  
  console.log('   ✅ DisTube se puede importar');
  console.log('   ✅ YtDlpPlugin se puede importar');
  
  // Intentar crear instancia
  const testClient = new Client({
    intents: [GatewayIntentBits.Guilds]
  });
  
  const testDistube = new DisTube(testClient);
  console.log('   ✅ DisTube se puede instanciar');
  
  const ytDlpPlugin = new YtDlpPlugin({ update: false });
  testDistube.use(ytDlpPlugin);
  console.log('   ✅ Plugin YT-DLP se puede configurar');
  
} catch (error) {
  console.log(`   ❌ Error con DisTube: ${error.message}`);
  errores.push(`Problema con DisTube: ${error.message}`);
}

// ============================================
// 5. PROBAR YT-SEARCH
// ============================================
console.log('\n🔍 Búsqueda de YouTube:');

try {
  const ytSearch = require('yt-search');
  console.log('   ✅ yt-search se puede importar');
  
  // Hacer una búsqueda de prueba
  console.log('   🔄 Probando búsqueda...');
  
  ytSearch('despacito').then(result => {
    if (result && result.videos && result.videos.length > 0) {
      console.log(`   ✅ Búsqueda funcional`);
      console.log(`   📊 Encontrados: ${result.videos.length} videos`);
      console.log(`   🎵 Primer resultado: ${result.videos[0].title}`);
    } else {
      advertencias.push('Búsqueda no retorna resultados');
    }
  }).catch(error => {
    advertencias.push(`Error en búsqueda: ${error.message}`);
  });
  
} catch (error) {
  console.log(`   ❌ Error con yt-search: ${error.message}`);
  errores.push(`Problema con yt-search: ${error.message}`);
}

// ============================================
// 6. VERIFICAR ESTRUCTURA DE CARPETAS
// ============================================
console.log('\n📁 Estructura de carpetas:');

const fs = require('fs');
const path = require('path');

const carpetasRequeridas = ['commands', 'commands/musica'];

for (const carpeta of carpetasRequeridas) {
  const rutaCompleta = path.join(__dirname, carpeta);
  if (fs.existsSync(rutaCompleta)) {
    console.log(`   ✅ ${carpeta}/`);
  } else {
    console.log(`   ⚠️  ${carpeta}/ no existe`);
    advertencias.push(`Carpeta faltante: ${carpeta}`);
  }
}

// Verificar comandos
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const archivos = fs.readdirSync(commandsPath, { recursive: true });
  const comandosJs = archivos.filter(f => f.endsWith('.js'));
  console.log(`   📊 Comandos encontrados: ${comandosJs.length}`);
}

// ============================================
// 7. RESUMEN
// ============================================
console.log('\n' + '='.repeat(50));
console.log('📋 RESUMEN DEL DIAGNÓSTICO');
console.log('='.repeat(50));

if (errores.length === 0 && advertencias.length === 0) {
  console.log('\n✅ ¡TODO ESTÁ BIEN!');
  console.log('🚀 El bot debería funcionar correctamente');
  console.log('\n💡 Ejecuta: node index.js');
} else {
  if (errores.length > 0) {
    console.log('\n❌ ERRORES CRÍTICOS:');
    errores.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  if (advertencias.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS:');
    advertencias.forEach((adv, i) => {
      console.log(`   ${i + 1}. ${adv}`);
    });
  }
  
  console.log('\n🔧 SOLUCIONES:');
  console.log('   1. Instalar dependencias faltantes:');
  console.log('      npm install discord.js distube @distube/yt-dlp yt-search dotenv');
  console.log('   2. Verificar archivo .env con DISCORD_TOKEN');
  console.log('   3. Crear carpetas necesarias: commands/musica/');
}

console.log('\n' + '='.repeat(50));
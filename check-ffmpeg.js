const { exec } = require('child_process');
const fs = require('fs');

console.log('🔍 Verificando dependencias...\n');

// Verificar ffmpeg
exec('ffmpeg -version', (error, stdout) => {
  if (error) {
    console.log('❌ FFMPEG NO ESTÁ INSTALADO O NO ESTÁ EN EL PATH');
    console.log('💡 Soluciones:');
    console.log('1. Ejecuta en PowerShell como Administrador:');
    console.log('   winget install Gyan.FFmpeg');
    console.log('2. O descarga manualmente desde: https://ffmpeg.org/download.html');
    console.log('3. Añade la carpeta "bin" a la variable PATH del sistema');
    console.log('\n📍 Ruta actual del PATH:', process.env.PATH);
  } else {
    console.log('✅ FFMPEG INSTALADO CORRECTAMENTE');
    console.log(stdout.split('\n')[0]); // Muestra la versión
  }
  
  // Verificar ffmpeg-static
  console.log('\n📦 Verificando ffmpeg-static...');
  try {
    const ffmpegStatic = require('ffmpeg-static');
    console.log('✅ ffmpeg-static instalado:', ffmpegStatic);
  } catch (err) {
    console.log('❌ ffmpeg-static no encontrado');
    console.log('💡 Ejecuta: npm install ffmpeg-static@^5.2.0');
  }
  
  // Verificar @discordjs/voice
  console.log('\n🎵 Verificando @discordjs/voice...');
  try {
    require('@discordjs/voice');
    console.log('✅ @discordjs/voice instalado');
  } catch (err) {
    console.log('❌ @discordjs/voice no encontrado');
    console.log('💡 Ejecuta: npm install @discordjs/voice@^0.16.0');
  }
});
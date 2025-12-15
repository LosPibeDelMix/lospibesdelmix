const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO CONFIGURACIÓN:\n');

// Verificar archivo .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env encontrado');
  
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  
  console.log('\n📄 Contenido (ocultando tokens completos):');
  lines.forEach(line => {
    if (line.includes('TOKEN') || line.includes('SECRET')) {
      const [key, value] = line.split('=');
      if (key && value) {
        console.log(`   ${key}=${value.substring(0, 10)}...`);
      }
    } else if (line.trim() && !line.startsWith('#')) {
      console.log(`   ${line}`);
    }
  });
} else {
  console.log('❌ NO hay archivo .env');
  console.log('\n💡 Crea un archivo .env con:');
  console.log('DISCORD_TOKEN=tu_token_aqui');
  console.log('CLIENT_ID=tu_client_id_aqui');
}

// Verificar variables cargadas
console.log('\n🌐 Variables en process.env:');
console.log(`   DISCORD_TOKEN: ${process.env.DISCORD_TOKEN ? '✅ Sí' : '❌ No'}`);
console.log(`   CLIENT_ID: ${process.env.CLIENT_ID ? '✅ Sí' : '❌ No'}`);
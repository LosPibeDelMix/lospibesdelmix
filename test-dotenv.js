console.log('🧪 PRUEBA DE CARGA DE .env\n');

// Prueba 1: Cargar dotenv
try {
  require('dotenv').config();
  console.log('✅ dotenv cargado');
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Prueba 2: Ver variables
console.log('\n🔍 Variables específicas:');
const vars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
vars.forEach(v => {
  const value = process.env[v];
  if (value) {
    console.log(`   ${v}: ${value.substring(0, 15)}... (${value.length} chars)`);
  } else {
    console.log(`   ${v}: ❌ NO DEFINIDA`);
  }
});

// Prueba 3: Ver todas las variables
console.log('\n📋 Todas las variables de entorno:');
Object.keys(process.env)
  .filter(key => key.includes('DISCORD') || key.includes('CLIENT') || key.includes('GUILD'))
  .forEach(key => {
    console.log(`   ${key}: ${process.env[key] ? '✅' : '❌'}`);
  });

// Prueba 4: Intentar conectar
console.log('\n🚀 Intentando conectar...');
if (process.env.DISCORD_TOKEN) {
  console.log('✅ Token disponible, puedes ejecutar node index.js');
} else {
  console.log('❌ No hay token, revisa tu archivo .env');
}
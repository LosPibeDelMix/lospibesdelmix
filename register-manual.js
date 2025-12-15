require('dotenv').config();
const { REST, Routes } = require('discord.js');

// Comandos básicos que funcionan
const commands = [
  {
    name: 'ping',
    description: 'Muestra la latencia del bot'
  },
  {
    name: 'test',
    description: 'Comando de prueba'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

console.log('🔄 Registrando comandos manualmente...');
console.log('TOKEN:', process.env.DISCORD_TOKEN ? 'Presente' : 'Falta');
console.log('CLIENT_ID:', process.env.CLIENT_ID);

rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
  .then((data) => {
    console.log(`✅ ${data.length} comandos registrados exitosamente`);
    console.log('Comandos:', data.map(cmd => cmd.name).join(', '));
    console.log('🎉 Ve a Discord y escribe / para verlos');
  })
  .catch((error) => {
    console.error('❌ Error completo:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
  });
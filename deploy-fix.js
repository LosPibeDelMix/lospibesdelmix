require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'ping',
    description: 'Muestra la latencia del bot'
  },
  {
    name: 'play',
    description: 'Reproduce música de YouTube',
    options: [{
      name: 'cancion',
      description: 'URL o nombre de la canción',
      type: 3,
      required: true
    }]
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Eliminando comandos existentes...');
    
    // Eliminar comandos globales
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('✅ Comandos eliminados');
    
    console.log('🔄 Registrando nuevos comandos...');
    
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log(`✅ ${data.length} comandos registrados exitosamente`);
    console.log('🎉 Listo! Ejecuta: npm start');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 50001) {
      console.log('💡 Solución: Activa "applications.commands" scope al invitar el bot');
    }
  }
})();
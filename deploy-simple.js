require('dotenv').config();

const { REST, Routes } = require('discord.js');

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('❌ Faltan DISCORD_TOKEN y CLIENT_ID en .env');
  process.exit(1);
}

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
  },
  {
    name: 'stop',
    description: 'Detiene la música'
  },
  {
    name: 'queue',
    description: 'Muestra la cola de reproducción'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comandos básicos...');
    
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log(`✅ ${data.length} comandos registrados`);
    console.log('🎉 Ahora ejecuta: npm start');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
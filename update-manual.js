const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function cargarComandos(directorio) {
  const items = fs.readdirSync(directorio, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(directorio, item.name);
    if (item.isDirectory()) {
      cargarComandos(itemPath);
    } else if (item.name.endsWith('.js')) {
      try {
        delete require.cache[require.resolve(itemPath)];
        const command = require(itemPath);
        if (command.data) {
          commands.push(command.data.toJSON());
        }
      } catch (error) {}
    }
  }
}

cargarComandos(commandsPath);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`📤 Subiendo ${commands.length} comandos...`);
    
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log(`✅ Listos: ${data.length} comandos`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

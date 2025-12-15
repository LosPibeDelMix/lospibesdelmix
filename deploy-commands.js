require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

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
      } catch (error) {
        logger.error(`Error cargando comando ${item.name}:`, error.message);
      }
    }
  }
}

cargarComandos(commandsPath);

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  logger.error('Faltan variables de entorno: DISCORD_TOKEN y CLIENT_ID son requeridas');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const timeout = setTimeout(() => {
      logger.error('Timeout: Discord no responde');
      process.exit(1);
    }, 60000);

    logger.info('Limpiando comandos duplicados...');
    
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID)
    );
    
    logger.info(`Comandos actuales: ${existingCommands.length}`);
    
    if (existingCommands.length > 0) {
      const deletePromises = existingCommands.map(command =>
        rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, command.id))
          .catch(() => {})
      );
      
      await Promise.all(deletePromises);
      logger.success(`${existingCommands.length} comandos eliminados`);
    }
    
    logger.info(`Registrando ${commands.length} comandos nuevos...`);
    
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    clearTimeout(timeout);
    logger.success(`Comandos registrados exitosamente: ${data.length}`);
    
    logger.info('Comandos disponibles:');
    data.forEach((cmd, index) => {
      logger.info(`  ${index + 1}. /${cmd.name} - ${cmd.description || 'Sin descripción'}`);
    });
    
    logger.success('¡Bot listo! Ejecuta: node index.js');
    
  } catch (error) {
    logger.error('Error registrando comandos:', error);
    
    if (error.code === 50001) {
      logger.info('SOLUCIÓN:');
      logger.info('1. Ve a https://discord.com/developers/applications');
      logger.info('2. Selecciona tu aplicación');
      logger.info('3. Ve a "Bot" → "Privileged Gateway Intents"');
      logger.info('4. Activa "MESSAGE CONTENT INTENT"');
    } else if (error.code === 50013) {
      logger.info('SOLUCIÓN:');
      logger.info('1. Verifica que el token en .env sea correcto');
      logger.info('2. Asegúrate de haber invitado el bot al servidor');
    }
    process.exit(1);
  }
})();
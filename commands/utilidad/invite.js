const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Obtén el enlace para invitar al bot a tu servidor'),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle('📨 Invita a Los Pibes del Mix')
      .setDescription('Haz clic en los botones de abajo para invitar al bot o unirte al servidor de soporte.')
      .addFields(
        {
          name: '🤖 Características',
          value: '• Música de YouTube, Spotify, SoundCloud\n• Cola de reproducción\n• Letras de canciones\n• Filtros de audio\n• Sistema de búsqueda\n• Comandos slash',
        },
        {
          name: '⚙️ Permisos necesarios',
          value: '• Conectar y hablar en canales de voz\n• Enviar mensajes\n• Usar comandos slash\n• Adjuntar archivos\n• Insertar enlaces',
        }
      )
      .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: '¡Gracias por usar el bot!',
      });
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Invitar Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.application.id}&permissions=2184204416&scope=bot%20applications.commands`),
      new ButtonBuilder()
        .setLabel('Soporte')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/nCHve2zcdq'), // Cambia esto por tu servidor
      new ButtonBuilder()
        .setLabel('GitHub')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/LosPibeDelMix/Terminos-de-servicios') // Cambia esto por tu repo
    );
    
    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: 64,
    });
  },
};
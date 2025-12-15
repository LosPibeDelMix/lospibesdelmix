const { EmbedBuilder } = require('discord.js');

const COLORS = {
  primary: 0x1DB954,
  success: 0x2ECC71,
  warning: 0xF39C12,
  error: 0xE74C3C,
  info: 0x3498DB,
  secondary: 0x9B59B6,
};

const createEmbed = (options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.primary)
    .setFooter({
      text: 'Los Pibes Del Mix 🎵',
      iconURL: options.client?.user?.avatarURL() || null
    })
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.fields) embed.addFields(...options.fields);
  if (options.author) embed.setAuthor(options.author);
  if (options.url) embed.setURL(options.url);

  return embed;
};

const createErrorEmbed = (title, description, fields = []) => {
  return createEmbed({
    color: COLORS.error,
    title: title,
    description: description,
    fields: fields
  });
};

const createSuccessEmbed = (title, description, fields = []) => {
  return createEmbed({
    color: COLORS.success,
    title: title,
    description: description,
    fields: fields
  });
};

const createInfoEmbed = (title, description, fields = []) => {
  return createEmbed({
    color: COLORS.info,
    title: title,
    description: description,
    fields: fields
  });
};

const createWarningEmbed = (title, description, fields = []) => {
  return createEmbed({
    color: COLORS.warning,
    title: title,
    description: description,
    fields: fields
  });
};

module.exports = {
  COLORS,
  createEmbed,
  createErrorEmbed,
  createSuccessEmbed,
  createInfoEmbed,
  createWarningEmbed
};

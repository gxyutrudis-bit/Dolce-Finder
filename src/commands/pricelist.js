const {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  TextDisplayBuilder,
} = require('discord.js');
const tiers = require('../../data/price-tiers.json');

const data = new SlashCommandBuilder()
  .setName('pricelist')
  .setDescription("View this server's private price tiers.");

function createPriceListContainer() {
  const rows = tiers.map(
    ({ discordPrice, ourPrice }) =>
      `₱${discordPrice} on Discord → ₱${ourPrice} our price`,
  );
  const content = ['# Private price tiers', ...rows].join('\n');

  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(content),
  );
}

async function execute(interaction) {
  await interaction.reply({
    components: [createPriceListContainer()],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

module.exports = { createPriceListContainer, data, execute };
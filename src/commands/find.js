const { SlashCommandBuilder } = require('discord.js');
const items = require('../../data/shop-items.json');
const {
  createNoticeContainer,
  createResultsContainer,
  toComponentsV2Payload,
} = require('../result-container');

const data = new SlashCommandBuilder()
  .setName('find')
  .setDescription('Search Discord Shop items.')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('What item are you looking for?')
      .setRequired(true),
  );

async function execute(interaction) {
  const query = interaction.options.getString('query').trim().toLowerCase();
  const matches = items
    .filter((item) =>
      `${item.name} ${item.description ?? ''}`.toLowerCase().includes(query),
    )
    .slice(0, 5);

  if (matches.length === 0) {
    await interaction.reply(
      toComponentsV2Payload(createNoticeContainer(`No shop items found for **${query}**.`)),
    );
    return;
  }

  await interaction.reply(
    toComponentsV2Payload(
      createResultsContainer(`Shop results for "${query}"`, matches),
    ),
  );
}

module.exports = { data, execute };
const { SlashCommandBuilder } = require('discord.js');
const { getShopItems } = require('../catalog-store');
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

function normalizeSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim();
}

function findMatches(query, candidates) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  return candidates
    .map((item, index) => {
      const name = normalizeSearchText(item.name);
      const description = normalizeSearchText(item.description ?? '');
      let score;

      if (name === normalizedQuery) score = 0;
      else if (name.startsWith(normalizedQuery)) score = 1;
      else if (name.includes(normalizedQuery)) score = 2;
      else if (description.includes(normalizedQuery)) score = 3;
      else return null;

      return { item, score, index };
    })
    .filter(Boolean)
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .slice(0, 5)
    .map(({ item }) => item);
}

async function execute(interaction) {
  const query = interaction.options.getString('query').trim();
  const items = await getShopItems();

  if (items.length === 0) {
    await interaction.reply(
      toComponentsV2Payload(
        createNoticeContainer(
          'The shop catalog is empty. Add items to `data/shop-items.json` first.',
        ),
      ),
    );
    return;
  }

  const matches = findMatches(query, items);

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

module.exports = { data, execute, findMatches };
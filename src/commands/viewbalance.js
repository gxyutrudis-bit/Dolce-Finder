const { SlashCommandBuilder } = require('discord.js');
const { formatBalance, getBalance } = require('../balance-store');

const data = new SlashCommandBuilder()
  .setName('viewbalance')
  .setDescription('View a member’s balance.')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('Member whose balance to view.')
      .setRequired(true),
  );

async function execute(interaction) {
  const user = interaction.options.getUser('user');
  const balance = await getBalance(interaction.guildId, user.id);
  await interaction.reply({
    content: `${user.username}’s balance is ${formatBalance(balance)}.`,
    ephemeral: true,
  });
}

module.exports = { data, execute };
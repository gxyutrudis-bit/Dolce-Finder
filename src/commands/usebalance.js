const { SlashCommandBuilder } = require('discord.js');
const {
  formatBalance,
  toMinorUnits,
  useBalance,
} = require('../balance-store');

const data = new SlashCommandBuilder()
  .setName('usebalance')
  .setDescription('Spend funds from your balance.')
  .addNumberOption((option) =>
    option
      .setName('amount')
      .setDescription('Amount to spend.')
      .setMinValue(0.01)
      .setMaxValue(1000000)
      .setRequired(true),
  );

async function execute(interaction) {
  const amount = toMinorUnits(interaction.options.getNumber('amount'));
  if (!amount) {
    await interaction.reply({
      content: 'Enter an amount with up to two decimal places.',
      ephemeral: true,
    });
    return;
  }

  const result = await useBalance(interaction.guildId, interaction.user.id, amount);
  if (!result.success) {
    await interaction.reply({
      content: `Insufficient balance. Your balance is ${formatBalance(result.balance)}.`,
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: `Spent ${formatBalance(amount)}. Your remaining balance is ${formatBalance(result.balance)}.`,
    ephemeral: true,
  });
}

module.exports = { data, execute };
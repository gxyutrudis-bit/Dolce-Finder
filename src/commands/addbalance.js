const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const {
  addBalance,
  formatBalance,
  toMinorUnits,
} = require('../balance-store');

const data = new SlashCommandBuilder()
  .setName('addbalance')
  .setDescription('Add funds to your balance.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addNumberOption((option) =>
    option
      .setName('amount')
      .setDescription('Amount to add.')
      .setMinValue(0.01)
      .setMaxValue(1000000)
      .setRequired(true),
  );

async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'You need the Manage Server permission to add balance.',
      ephemeral: true,
    });
    return;
  }

  const amount = toMinorUnits(interaction.options.getNumber('amount'));
  if (!amount) {
    await interaction.reply({
      content: 'Enter an amount with up to two decimal places.',
      ephemeral: true,
    });
    return;
  }

  const balance = await addBalance(interaction.guildId, interaction.user.id, amount);
  await interaction.reply({
    content: `Added ${formatBalance(amount)} to your balance. Your new balance is ${formatBalance(balance)}.`,
    ephemeral: true,
  });
}

module.exports = { data, execute };
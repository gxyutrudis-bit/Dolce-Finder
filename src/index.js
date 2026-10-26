require('dotenv').config();

const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const findCommand = require('./commands/find');
const findImageCommand = require('./commands/findimage');
const addBalanceCommand = require('./commands/addbalance');
const viewBalanceCommand = require('./commands/viewbalance');
const useBalanceCommand = require('./commands/usebalance');
const priceListCommand = require('./commands/pricelist');

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error('DISCORD_TOKEN is required. Add it to your .env file.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = new Collection([
  [findCommand.data.name, findCommand],
  [findImageCommand.data.name, findImageCommand],
  [addBalanceCommand.data.name, addBalanceCommand],
  [viewBalanceCommand.data.name, viewBalanceCommand],
  [useBalanceCommand.data.name, useBalanceCommand],
  [priceListCommand.data.name, priceListCommand],
]);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Command /${interaction.commandName} failed:`, error);
    const reply = {
      content: 'Something went wrong while running this command.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(token);
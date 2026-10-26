require('dotenv').config();

const { REST, Routes } = require('discord.js');
const findCommand = require('../src/commands/find');
const findImageCommand = require('../src/commands/findimage');
const addBalanceCommand = require('../src/commands/addbalance');
const viewBalanceCommand = require('../src/commands/viewbalance');
const useBalanceCommand = require('../src/commands/usebalance');
const priceListCommand = require('../src/commands/pricelist');

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  throw new Error(
    'Set DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID in your .env file.',
  );
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

rest
  .put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), {
    body: [
      findCommand.data.toJSON(),
      findImageCommand.data.toJSON(),
      addBalanceCommand.data.toJSON(),
      viewBalanceCommand.data.toJSON(),
      useBalanceCommand.data.toJSON(),
      priceListCommand.data.toJSON(),
    ],
  })
  .then(() => console.log('Registered bot commands in the development server.'))
  .catch((error) => {
    console.error('Could not register /find:', error);
    process.exitCode = 1;
  });
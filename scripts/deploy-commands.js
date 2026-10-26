require('dotenv').config();

const { REST, Routes } = require('discord.js');
const findCommand = require('../src/commands/find');
const findImageCommand = require('../src/commands/findimage');
const addBalanceCommand = require('../src/commands/addbalance');
const viewBalanceCommand = require('../src/commands/viewbalance');
const useBalanceCommand = require('../src/commands/usebalance');
const priceListCommand = require('../src/commands/pricelist');

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error(
    'Set DISCORD_TOKEN and DISCORD_CLIENT_ID in your .env file.',
  );
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

rest
  .put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
    body: [
      findCommand.data.toJSON(),
      findImageCommand.data.toJSON(),
      addBalanceCommand.data.toJSON(),
      viewBalanceCommand.data.toJSON(),
      useBalanceCommand.data.toJSON(),
      priceListCommand.data.toJSON(),
    ],
  })
  .then(async () => {
    if (DISCORD_GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
        { body: [] },
      );
    }

    console.log('Registered global bot commands.');
  })
  .catch((error) => {
    console.error('Could not register global bot commands:', error);
    process.exitCode = 1;
  });
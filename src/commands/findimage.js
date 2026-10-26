const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const items = require('../../data/shop-items.json');
const { MAX_IMAGE_BYTES, findImageMatches } = require('../image-search');
const {
  createNoticeContainer,
  createResultsContainer,
  toComponentsV2Payload,
} = require('../result-container');

const data = new SlashCommandBuilder()
  .setName('findimage')
  .setDescription('Find shop items from an image.')
  .addAttachmentOption((option) =>
    option
      .setName('image')
      .setDescription('Image of the shop item you are looking for.')
      .setRequired(true),
  );

async function execute(interaction) {
  const attachment = interaction.options.getAttachment('image');
  if (
    !attachment.contentType?.startsWith('image/') ||
    attachment.size > MAX_IMAGE_BYTES
  ) {
    await interaction.reply({
      ...toComponentsV2Payload(
        createNoticeContainer('Please attach an image smaller than 8 MB.'),
      ),
      flags: MessageFlags.IsComponentsV2,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 });
  try {
    const response = await fetch(attachment.url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Could not download the attached image.');
    const queryImage = Buffer.from(await response.arrayBuffer());
    if (queryImage.length > MAX_IMAGE_BYTES) {
      await interaction.editReply(
        toComponentsV2Payload(
          createNoticeContainer('Please attach an image smaller than 8 MB.'),
        ),
      );
      return;
    }

    const matches = await findImageMatches(queryImage, items);
    if (matches.length === 0) {
      await interaction.editReply(
        toComponentsV2Payload(
          createNoticeContainer(
            'No close image matches found. Shop items need an `imageUrl` in the catalog to appear here.',
          ),
        ),
      );
      return;
    }

    await interaction.editReply(
      toComponentsV2Payload(
        createResultsContainer(
          `Found ${matches.length} shop item${matches.length === 1 ? '' : 's'} matching your image`,
          matches,
        ),
      ),
    );
  } catch (error) {
    console.error('Image search failed:', error);
    await interaction.editReply(
      toComponentsV2Payload(
        createNoticeContainer('Could not search that image. Please try again.'),
      ),
    );
  }
}

module.exports = { data, execute };
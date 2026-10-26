const {
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} = require('discord.js');
const { formatPrice } = require('./format-price');
const { formatCategory, formatOrbsPrice } = require('./format-item-details');

function createNoticeContainer(message) {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(message.slice(0, 4000)),
  );
}

function createResultsContainer(title, items) {
  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${title.slice(0, 500)}`),
  );

  items.slice(0, 5).forEach((item, index) => {
    if (index > 0) {
      container.addSeparatorComponents(new SeparatorBuilder());
    }

    const itemName = String(item.name ?? 'Shop item').slice(0, 256);
    const name = item.url ? `[${itemName}](${item.url})` : itemName;
    const category = formatCategory(item.category);
    const orbsPrice = formatOrbsPrice(item.orbsPrice);
    const details = [
      `## ${name}`,
      item.description ? String(item.description).slice(0, 400) : null,
      category ? `**Type:** ${category}` : null,
      `**Price:** ${formatPrice(item)}`,
      orbsPrice ? `**Orbs price:** ${orbsPrice}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(details.slice(0, 1000)),
    );

    if (isHttpsUrl(item.imageUrl)) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder()
            .setURL(item.imageUrl)
            .setDescription(itemName.slice(0, 1024)),
        ),
      );
    }
  });

  return container;
}

function toComponentsV2Payload(container) {
  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

function isHttpsUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = {
  createNoticeContainer,
  createResultsContainer,
  toComponentsV2Payload,
};
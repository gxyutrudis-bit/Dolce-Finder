const fs = require('node:fs/promises');
const path = require('node:path');

const defaultCatalogFile = path.join(__dirname, '..', 'data', 'shop-items.json');

function createCatalogStore(catalogFile = defaultCatalogFile) {
  let operationQueue = Promise.resolve();

  function enqueue(operation) {
    const result = operationQueue.then(operation);
    operationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  function getShopItems() {
    return enqueue(async () => {
      try {
        const contents = await fs.readFile(catalogFile, 'utf8');
        const items = JSON.parse(contents);
        if (!Array.isArray(items)) {
          throw new Error('Shop catalog must be a JSON array.');
        }
        return items;
      } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
      }
    });
  }

  function replaceShopItems(items) {
    return enqueue(async () => {
      await fs.mkdir(path.dirname(catalogFile), { recursive: true });
      const temporaryFile = `${catalogFile}.${process.pid}.${Date.now()}.tmp`;
      try {
        await fs.writeFile(temporaryFile, `${JSON.stringify(items, null, 2)}\n`, {
          flag: 'wx',
        });
        await fs.rename(temporaryFile, catalogFile);
      } catch (error) {
        await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
        throw error;
      }
      return items.length;
    });
  }

  return { getShopItems, replaceShopItems };
}

const catalogStore = createCatalogStore();

module.exports = {
  createCatalogStore,
  getShopItems: catalogStore.getShopItems,
  replaceShopItems: catalogStore.replaceShopItems,
};
const sharp = require('sharp');

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DISTANCE = 12;
const MAX_RESULTS = 5;

async function readImage(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Image URLs must use HTTPS.');
  }

  const response = await fetch(parsedUrl, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Image request failed: ${response.status}`);

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error('URL did not return an image.');
  }

  const contentLength = Number(response.headers.get('content-length'));
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large.');
  }

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of response.body) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_IMAGE_BYTES) {
      await response.body.cancel();
      throw new Error('Image is too large.');
    }
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function calculatePerceptualHash(imageBuffer) {
  const { data } = await sharp(imageBuffer)
    .rotate()
    .resize(32, 32, { fit: 'fill' })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const coefficients = [];
  for (let vertical = 0; vertical < 8; vertical += 1) {
    for (let horizontal = 0; horizontal < 8; horizontal += 1) {
      if (vertical === 0 && horizontal === 0) continue;

      let coefficient = 0;
      for (let y = 0; y < 32; y += 1) {
        const verticalWeight = Math.cos(((2 * y + 1) * vertical * Math.PI) / 64);
        for (let x = 0; x < 32; x += 1) {
          const horizontalWeight = Math.cos(
            ((2 * x + 1) * horizontal * Math.PI) / 64,
          );
          coefficient +=
            data[y * 32 + x] * verticalWeight * horizontalWeight;
        }
      }
      coefficients.push(coefficient);
    }
  }

  const sorted = [...coefficients].sort((left, right) => left - right);
  const median = sorted[Math.floor(sorted.length / 2)];
  return coefficients.reduce(
    (hash, coefficient, index) =>
      coefficient > median ? hash | (1n << BigInt(index)) : hash,
    0n,
  );
}

function hammingDistance(left, right) {
  let difference = left ^ right;
  let distance = 0;
  while (difference) {
    distance += Number(difference & 1n);
    difference >>= 1n;
  }
  return distance;
}

async function findImageMatches(queryBuffer, items) {
  const queryHash = await calculatePerceptualHash(queryBuffer);
  const candidates = items.filter(
    (item) => typeof item.imageUrl === 'string' && item.imageUrl.length > 0,
  );
  const matches = await Promise.all(
    candidates.map(async (item) => {
      try {
        const imageHash = await calculatePerceptualHash(
          await readImage(item.imageUrl),
        );
        const distance = hammingDistance(queryHash, imageHash);
        return distance <= MAX_IMAGE_DISTANCE ? { item, distance } : null;
      } catch (error) {
        console.warn(`Skipping image for shop item "${item.name}": ${error.message}`);
        return null;
      }
    }),
  );

  return matches
    .filter(Boolean)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, MAX_RESULTS)
    .map(({ item }) => item);
}

module.exports = {
  MAX_IMAGE_BYTES,
  calculatePerceptualHash,
  findImageMatches,
};
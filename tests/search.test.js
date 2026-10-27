const assert = require('node:assert/strict');
const { test } = require('node:test');
const sharp = require('sharp');
const { findMatches } = require('../src/commands/find');
const { calculatePerceptualHash } = require('../src/image-search');

test('find matches partial names and ranks name matches before descriptions', () => {
  const exact = { name: 'Étoile Frame' };
  const partial = { name: 'Étoile Frame Deluxe' };
  const description = { name: 'Celestial Border', description: 'Étoile Frame' };

  assert.deepEqual(findMatches('etoile frame', [description, partial, exact]), [
    exact,
    partial,
    description,
  ]);
  assert.deepEqual(findMatches('frame del', [partial, exact]), [partial]);
  assert.deepEqual(findMatches('   ', [exact]), []);
});

test('image hashes normalize transparent decorations onto white', async () => {
  const artwork = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="24" fill="#d43776"/><path d="M16 32h32M32 16v32" stroke="#fff" stroke-width="4"/></svg>',
  );
  const transparent = await sharp(artwork).png().toBuffer();
  const whiteBackground = await sharp(artwork)
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();

  assert.equal(
    await calculatePerceptualHash(transparent),
    await calculatePerceptualHash(whiteBackground),
  );
});
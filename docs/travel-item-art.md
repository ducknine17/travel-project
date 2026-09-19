# Travel item artwork

- Mode: built-in `image_gen` image editing, using the user's two references.
- Output: `frontend/public/assets/bf/travel-items.png` (1536 × 1024 PNG with alpha).
- References: `frontend/public/assets/bf/travel-items-reference.png` and `frontend/public/assets/bf/travel-map-reference.png`.
- Display: `ItemArt.jsx` selects the individual illustrations with SVG viewBoxes; the PNG is kept intact. The hat frame omits its upper keychain ring for wearing on the character.

## Final prompt

Use case: background-extraction. Produce one transparent PNG sprite sheet for a website's collectible travel accessories, based faithfully on attached reference artwork. Image 1 is the edit target; Image 2 supplies the replacement map. Keep the exact charming navy outline, cream/light blue shading and gold keychain rings of the references. SIX objects ONLY, evenly laid out in a strict 3-column by 2-row grid of equal square cells, each object entirely within the central 75% of its cell with ample transparent padding. Row 1: gold pocket compass, blue camera, white/light blue paw tumbler. Row 2: blue paw travel notebook, cream travel sun hat with blue band, rolled parchment travel map from image 2. Replace the scarf with the map. Remove ALL Korean labels, sample dog, scarf, and backgrounds. Actual transparent alpha background, no white rectangles, no checkerboard drawn into the image. Preserve the cream and white fills INSIDE the objects. No extra objects, no text. Each object centered in its cell. Output landscape 3:2 sheet.

## Verification

- Collection migration and bag persistence: 3 Jest tests passed.
- Browser checks with mocked API responses: desktop (1280px), mobile (390px), all four characters, selection/save, three-item limit, and My Bag rendering.
- Original unlock requirements remain in effect; the map takes the former scarf/goggles first-post unlock. Tumbler remains pending visit verification.

# BF banner artwork

## Pose revision

- Mode: built-in `image_gen` edit.
- Output: `assets/bef-banner-v2.png` (2172 × 724 PNG).
- Selected poses: retriever reading, poodle leaning on backpack (top left), shiba writing (bottom left), dachshund holding badge (bottom right).
- References: original banner and the poodle, shiba, dachshund sprite sheets in `frontend/public/assets/bf/`.

### Revision prompt

Edit reference image 1, the existing wide BF 베프 banner. Preserve its 3:1 horizontal layout, left BF 베프 paw logo exactly, warm ivory paper background, navy outlines, character identities, colors, overall spacing and scale. Change only the dogs' poses so EVERY dog has a DIFFERENT pose selected faithfully from the supplied 2x2 reference sprite sheets. Image 2 is the poodle pose reference; image 3 the shiba pose reference; image 4 the dachshund pose reference. Keep dogs in original left-to-right breed order. Retriever: keep its existing seated reading-open-blue-notebook pose. Poodle: use image 2 TOP LEFT pose, head tilted curiously with both paws resting on the top of a large blue backpack in front of its body, tail peeking beside bag. Shiba: use image 3 BOTTOM LEFT pose, seated leaning forward writing with an oversized blue-and-gold pencil in an open cream notebook on the ground; blue backpack behind it. Dachshund: use image 4 BOTTOM RIGHT pose, seated presenting a round blue paw badge with gold border in both paws, a tiny gold sparkle on either side, backpack beside its body. Exactly four dogs and exactly these four distinct actions: reading, leaning on bag, writing, showing badge. Keep all props and characters fully inside the canvas, visually aligned to a shared ground baseline, no overlaps obscuring faces. Retain reference illustration style faithfully, soft subtle paper texture, cute broad heads, dot eyes, tiny noses. No added labels, text, characters, scenery, UI or watermark. Logo must remain unchanged.

- Mode: built-in `image_gen`.
- Output: `assets/bef-banner.png` (2172 × 724 PNG).
- References: `assets/bef-logo.png`, `frontend/public/assets/bf/friends.png`, `frontend/public/assets/bf/mascot-sprite.png`.

## Final prompt

Create one polished wide horizontal README brand banner image for BF 베프, approximately 3:1 aspect ratio. Reference image 1 is the existing brand logo to preserve faithfully: blue 'BF 베프' lettering with the paw cutout inside B. Reference image 2 supplies the identities of exactly four dog mascots: cream golden retriever, fluffy white poodle, orange-and-cream shiba, brown dachshund with dark floppy ears. Reference image 3 supplies the existing illustration style and full sitting body proportions. Compose a balanced spacious banner with the original BF 베프 logo large and readable on the left and the four dogs seated side by side on the right, fully visible feet and tails, cute tiny front paws, blue travel backpacks worn on their backs or at their sides so their seated bodies are clearly visible. All four face the viewer. Keep their distinctive original flat broad heads, navy outlines, dot eyes and small oval noses; cream, dusty blue and warm tan coloring and delicate paper-grain shading. Warm ivory plain background, subtle grounding shadows, generous padding on every edge. Charming restrained illustrated brand artwork, consistent with the provided assets. Raster PNG banner, no photorealistic dogs, no 3D, no UI frame, no extra headings or slogans or breed-name labels, no additional characters. Only text is the faithful original BF 베프 logo. Do not crop any mascot or logo.

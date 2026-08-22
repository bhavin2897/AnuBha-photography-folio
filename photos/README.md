# Managing portfolio photographs

This folder is the source of truth for the homepage gallery.

1. Add JPG, PNG, WebP, TIFF or TIF photographs here.
2. Remove a file from this folder to remove it from the gallery.
3. Run `npm start`. The gallery rebuilds automatically whenever this folder changes.

Photos appear in filename order. Use a two-digit prefix to control the order, for example:

- `01-sunset-in-hannover.jpg`
- `02-forest-portrait.jpg`

The prefix is not shown to visitors. Descriptive filenames produce better accessible descriptions, so prefer `03-couple-at-maschsee.jpg` over `IMG_1234.jpg`.

Do not place the About or Contact portrait here; those remain in `dist/assets`.

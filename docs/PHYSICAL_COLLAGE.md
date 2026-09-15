# Physical Collage & Stop-Motion System

The visual unit is now a **Shot**, not a single image.

## Mental model

- **Layout** = composition grammar. It decides how many visual resources the shot normally needs.
- **Asset** = one image/document/photo/map/object resource.
- **Motion** = animation applied to an asset or graphic layer.
- **Background** = physical surface behind the collage.
- **Border** = physical paper-edge treatment.
- **Graphics** = procedural arrows, strings, pins, tape, stamps and lines.

A shot may contain many assets. `Photo Stack Land` is intentionally a multi-asset motion: the minimum is 3 photos.

## Layout requirements

| Layout | Minimum images | Typical use |
|---|---:|---|
| Hero Archive | 1 | One dominant archival image |
| Newspaper Headline | 2 | Headline + supporting photo |
| Archival Map | 2 | Map + evidence/detail |
| Photo Stack | 3 | Multiple photographs physically stacked |
| Declassified Document | 2 | Document + clipping/evidence |
| Big Editorial Metric | 1 | Metric + optional support |
| Horizontal Timeline | 3 | Chronological evidence cards |
| Investigation Collage Board | 4 | Multiple evidence items |
| Split Screen | 2 | Exactly two simultaneous panels |

## Motion categories

### Single-asset
`Paper Drop`, `Paper Slide Left`, `Paper Slide Right`, `Paper Slide Up`, `Paper Slide Down`, `Paper Reveal`.

### Multi-asset choreography
`Photo Stack Land` — each selected image lands as part of the physical stack.

### Text/graphic layers
`Typewriter Text`, `Headline Pop`, `Official Stamp`, `Red Arrow Draw`, `Red String Tension`.

These do not create images. They animate existing text/graphics or relationships between visual evidence.

## UI workflow

1. Select a shot.
2. Select a layout.
3. Click **Prepare** / **Build Required Assets**.
4. The studio creates the required asset slots and prompts automatically.
5. Generate each asset with AI or upload a local image into the selected slot.
6. Choose motion per asset when needed.
7. The compositor renders every ready asset into the same shot.
8. Quality Gate rejects layouts that do not contain the required number of assets.

## Photo Stack example

For a shot about a historical computer company, a `Photo Stack` can contain:

1. Location / factory photo — hero.
2. Founder portrait — secondary.
3. Product photo — secondary.

All three are independent image assets. `Photo Stack Land` is then assigned to each asset, producing staggered physical landings rather than trying to make one generated image represent the entire stack.

# StudioSabha diagrams

PlantUML sources (`*.puml`) with rendered images in `png/`. All share `_style.iuml` (site colours).

| File | Diagram |
|---|---|
| `01-architecture.puml` | System architecture: Next.js app, Supabase, Square, Resend, AR viewers |
| `02-data-model.puml` | Database tables and relationships |
| `03-use-cases.puml` | What visitors and the artist can do |
| `04-sitemap.puml` | Public pages and admin pages |
| `05-seq-checkout.puml` | Buy now → Square → webhook |
| `06-seq-inquiry.puml` | Contact / commission inquiry |
| `07-seq-admin-upload.puml` | Adding artwork: watermarking, wall photo, cache refresh |
| `08-state-artwork.puml` | Artwork statuses |
| `09-state-order.puml` | Order statuses |
| `10-test-cases.puml` | Test cases with status (verified / to test / blocked) |

## Regenerating the PNGs

Needs Java. Download `plantuml.jar` from https://plantuml.com/download (no install needed), then from this folder:

```
java -jar /path/to/plantuml.jar -tpng -o png *.puml
```

Graphviz isn't required: the diagrams that need a layout engine use PlantUML's built-in one (`!pragma layout smetana`).

Update `10-test-cases.puml` as tests are run (green = verified, yellow = to test, grey = blocked) and when Square, Resend or hosting are set up.

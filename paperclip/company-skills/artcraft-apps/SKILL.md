---
name: artcraft-apps
description: Make and edit marketing materials (banners, social graphics, flyers, one-pagers, slide decks, PDFs) with the company's own ArtCraft Craft apps server - PhotoCraft, VectorCraft, DesignCraft, DeckCraft and PdfCraft - driven headlessly through a helper script. Covers the server's working hours, finding commands, running them, previewing, and fetching the exported files. Use when a task asks for a designed visual, layout, deck or PDF. Free to use; no credits are spent.
---

# ArtCraft Craft apps

The company runs its own server with the headless Craft apps. You drive them with commands, not a screen: build a document step by step, export it, look at the preview, fix, repeat. Nothing here spends money. (AI image and video generation is a different skill, `artcraft-generate`, and does spend credits.)

## Working hours

**The server only runs on weekdays from 5pm to 9pm Pacific.** Outside that window it is switched off to save cost and every call fails.

- Before starting, run `craft.py window`. It prints `OPEN` or `CLOSED` and the current Pacific time.
- If it is closed, do the work that does not need the server (brief, copy, layout plan, the exact steps you will run), write that into the task, and say the design step is waiting for the next window. Do not retry in a loop.
- In the first minutes after 5pm the server may still be starting. If a call fails while the window is open, wait 5 minutes and try once more, then tell the board.
- Do not start something at 8:50pm that needs twenty minutes. Exports left on the server are still there the next day.

## Rules

1. **Drafts only.** Never publish, post or send results anywhere. Attach or link them in the task for review.
2. **The token is a secret.** It is in `ARTCRAFT_MCP_TOKEN` (for Hermes: `MCP_ARTCRAFT_API_KEY`). Never print, echo, log or write it to a file. Use the helper script, which reads it from the environment. If it is missing or the server answers 401, stop and tell the board; do not look for another token.
3. **Save only under `/work/outputs/`.** That is the one folder on the server you can write to and download from. Use clear names with the task id, for example `/work/outputs/SPA-70-launch-banner.png`. Other agents share the folder: do not overwrite or delete files you did not make.
4. **Rights.** Use only the company's own assets or clearly licensed material. No real people's likeness, no other outlets' logos or work. Label anything that could be mistaken for real mission imagery as an illustration.
5. **Look before you report.** Open the preview image of every export and check it against the brief (text spelled right, nothing cut off, right size) before calling it done.

## Helper script

`scripts/craft.py` (in this skill's folder) needs only `python3`.

```sh
C="python3 <path to this skill>/scripts/craft.py"
$C window                               # is the server up right now?
$C apps                                 # installed apps
$C commands vectorcraft text            # find command IDs by keyword
$C commands vectorcraft --ids text.create,shape.rectangle   # parameters of exact commands
$C help photocraft convert              # an app's CLI help
$C run request.json                     # run steps, see below
$C cli pdfcraft info /work/outputs/x.pdf   # one CLI subcommand, verbatim
$C files                                # what is in /work/outputs
$C get SPA-70-launch-banner.png         # download an export into the current folder
```

Preview images are saved to `.craft/previews/` in the current folder. Never commit `.craft/`.

## If you have native `artcraft_*` tools

Some agents (Richard, through Hermes) are connected to the same server directly and see five tools: `artcraft_apps`, `artcraft_commands`, `artcraft_run`, `artcraft_cli`, `artcraft_help`. They are the same operations as the script's `apps`, `commands`, `run`, `cli` and `help`; the arguments of `artcraft_run` are exactly the `request.json` shown below. Use the tools directly, and use the script only for `window`, `files` and `get` (the tools cannot download a file to you). Every rule on this page applies either way, including the working hours: outside the window the tools are simply missing or fail to connect.

## Which app

| App | Use it for |
| --- | --- |
| `vectorcraft` | Logos, banners, social graphics, illustrations: shapes, type, artboards. Export PNG, SVG, PDF |
| `photocraft` | Photos and raster images: crop, resize, adjust, layers, text on images. Export PNG, JPG, WebP |
| `designcraft` | Page layout: flyers, one-pagers, newsletters, multi-page documents |
| `deckcraft` | Slide decks |
| `pdfcraft` | Inspect, merge, split and check PDFs |

## Running steps

`request.json` holds one run: the app, the steps in order, and where to save.

```json
{
  "app": "vectorcraft",
  "steps": [
    {"id": "shape.rectangle", "params": {"x": 0, "y": 0, "width": 1200, "height": 630}},
    {"id": "text.create", "params": {"x": 80, "y": 330, "text": "Space Exploration News", "size": 72}}
  ],
  "output": "/work/outputs/SPA-70-banner.png",
  "preview": "auto"
}
```

- `steps`: command `id` plus `params`. Find IDs with `commands APP <keyword>`, then read their parameters with `commands APP --ids a,b`. Do not guess parameter names.
- `output`: file to write; the extension picks the format. To keep working on a design later, also save the app's own project format and pass it back as `input` in the next run.
- `input`: an existing file to open (under `/work/inputs/` or `/work/outputs/`).
- `preview`: `"auto"` returns a small image of the result. Use it on every export.
- `timeout_ms`: default 120000. Raise it for heavy work.

Each run is a fresh session: nothing carries over between runs except files. A run either starts a new document or opens `input`.

Things that catch people out:

- **Set the canvas size first.** A new VectorCraft document has a default artboard (612 x 792). Find the artboard or document commands (`commands vectorcraft artboard`) and set the size the brief asks for before placing anything.
- **Colours** are hex like `#1a2b3c`. Read the command's parameters: some refuse alpha forms.
- **Fonts** on the server are limited (DejaVu, Liberation). If a command warns that a font is unavailable, it used a fallback: say so in the task.
- **A command listed as not enabled** needs something first, usually a selection or an open document of the right kind.

## Source files

You cannot upload to the server. If the task needs a logo, photo or brand file, check `$C cli photocraft info /work/inputs/<name>` or ask the board to place it in the server's `inputs/` folder, and name the file you need. Otherwise build from shapes and type.

## Common sizes

| Use | Size (px) |
| --- | --- |
| Site hero / link preview (Open Graph) | 1200 x 630 |
| X / LinkedIn post | 1200 x 675 |
| Instagram square | 1080 x 1080 |
| Instagram / TikTok story, Shorts | 1080 x 1920 |
| YouTube thumbnail | 1280 x 720 |
| Newsletter header | 1200 x 400 |

## Recording the work

In the task, keep a short document (for example "Design files") listing each export: file name on the server, size, what it is for, and the steps or request file that made it. Download the final files with `get` and attach them. End with which version you recommend and what is still open.

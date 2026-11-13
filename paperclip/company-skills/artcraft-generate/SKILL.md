---
name: artcraft-generate
description: Generate draft images and short videos with ArtCraft's Omni API (Seedance and other models) for marketing and editorial work. Covers writing prompts, the approval and spending rules, submitting a job, waiting for it, and recording the result. Use when a task asks for a generated image, video clip, animated hero or social visual made with ArtCraft.
---

# ArtCraft generation

ArtCraft's Omni API turns a prompt (and optional reference images, video or audio) into an image or video. Every job spends credits on the company's ArtCraft account, so generating is a spending decision, not a drafting step.

## Rules

1. **Only generate when the task says so.** The task (or a board comment on it) must say to generate with ArtCraft and give a number of generations. If it does not, write the prompts and settings into the task, ask the board for approval with a count, and stop.
2. **Stay within the approved count.** Count every submitted job, including failed ones. Never retry a failure more than once without asking.
3. **Image before video.** Video costs much more. Settle the look with images first unless the task asks for video only.
4. **Short and small by default.** Video: 5 or 6 seconds, `seven_twenty_p`, no audio, unless the task asks otherwise.
5. **Drafts only.** Never publish, post or send results anywhere. Link them in the task for review.
6. **The key is a secret.** It is in `ARTCRAFT_API_KEY`. Never print, echo, log or write it to a file, and never put it in a command line you show. Use the helper script, which reads it from the environment.
7. **Rights.** Use only reference media you are allowed to use: the company's own assets, public-domain or clearly licensed images (note the licence). Never use real people's likeness, logos or another outlet's work as references. No misleading depictions of real missions or events: label anything that could be mistaken for real imagery as an illustration.

If `ARTCRAFT_API_KEY` is not set, or a call returns 401 (bad key) or 402 (out of credits), stop and tell the board in the task. Do not look for another key.

## Helper script

`scripts/artcraft.py` (in this skill's folder) handles auth, a fresh idempotency token per request, polling, and a job ledger. It needs only `python3`.

```sh
S=<path to this skill>/scripts/artcraft.py
python3 "$S" video request.json --max 2    # submit; refuses once the ledger holds 2 jobs
python3 "$S" image request.json --max 2
python3 "$S" wait jinf_xxx                  # poll every 10 s until done; prints the result URL
python3 "$S" status jinf_xxx                # one status check
python3 "$S" ledger                         # jobs submitted from this workspace
```

`--max` is the approved count for the task and is required. The ledger is `.artcraft/jobs.jsonl` in the current folder; never commit `.artcraft/`.

## Video request

`request.json` for `POST /v1/omni_api/generate/video` (the script adds `idempotency_token`):

```json
{
  "model": "seedance_2p0",
  "prompt": "Slow push-in on a lunar lander on grey regolith, low sun, long shadows, Earth small in a black sky, cinematic, photoreal",
  "negative_prompt": "text, watermark, logos, people",
  "duration_seconds": 6,
  "aspect_ratio": "wide_sixteen_by_nine",
  "resolution": "seven_twenty_p",
  "generate_audio": false
}
```

- `aspect_ratio`: `wide_sixteen_by_nine` (site, YouTube), `tall_nine_by_sixteen` (Shorts, Reels, TikTok, Stories), `square`.
- Optional URL inputs: `start_frame_image_url`, `end_frame_image_url`, `reference_image_urls` (list), `reference_video_urls` (list, mp4 only), `reference_audio_urls` (list). URLs must be http(s) and reachable; images must be jpeg, png, gif or webp. Do not also send the matching `*_media_token(s)` field.
- `seedance_2p0` is the documented model. Use another model only if the task names it.

## Image request

`POST /v1/omni_api/generate/image` takes `model`, `prompt` and optionally `image_urls` (reference images). Its other fields and model names are not in the public guide, so use the model the task names and keep to those fields. If it returns 400, put the error in the task and ask; do not guess repeatedly.

## Writing prompts

- Subject first, then setting, light, camera and style: "Close-up of the Perseverance rover's wheel on red dust, late-afternoon light, shallow depth of field, photoreal".
- One idea per clip. Name the camera move for video (push-in, slow orbit, static).
- Match the site's look: accurate spacecraft and planets, no invented hardware presented as real.
- Use `negative_prompt` for text, watermarks, logos and extra limbs or faces.
- For variations, change one thing at a time and say which.

## Recording the work

Keep a document on the task (for example "ArtCraft generations") with one entry per job: the prompt and settings, the job token, the final status, and the result URL (`cdn_url`) or the failure. Link the preview (`maybe_video_previews.still` for video) where useful. End with which result you recommend and why, and how many of the approved generations were used.

# VOX Style — Runtime Setup

## 1. Gemini image generation

Set:

```env
GEMINI_API_KEY=...
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_IMAGE_SIZE=1K
IMAGE_FALLBACK_ENABLED=1
```

`gemini-3.1-flash-image` is the primary image provider. If the provider is unavailable and fallback is enabled, the engine creates a deterministic archival placeholder instead of leaving the shot empty. The API response reports `provider`, `usedFallback`, and `providerError` so the application can distinguish a real AI image from a fallback.

For production, set `IMAGE_FALLBACK_ENABLED=0` when you want an unavailable Gemini image provider to block generation instead of silently falling back.

## 2. Gemini TTS

The primary cloud TTS path is:

```env
TTS_PROVIDER=auto
GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview
GEMINI_TTS_VOICE=Kore
```

The UI voice IDs are mapped to real Gemini TTS voices:

- `vi_female` → `Kore`
- `vi_male` → `Charon`
- `en_male` → `Puck`
- `en_female` → `Aoede`

Generated PCM is wrapped as WAV and passed through conservative rumble/hiss reduction and loudness normalization before it is stored under `outputs/audio`.

## 3. Local VieNeu

VieNeu is intended for a local desktop runtime:

```env
VIENU_TTS_URL=http://127.0.0.1:8000
```

A Cloud Run container cannot access a TTS service running on the developer's Windows machine through `127.0.0.1`. Use Gemini/Google cloud TTS in Cloud Run, or expose a secured reachable TTS endpoint.

## 4. Final render gate

Final render is blocked until all of these are valid:

- script
- at least one asset in every shot
- every image asset resolved
- safe-area text
- continuous timeline
- FFmpeg
- voice and voice duration when `project.voiceover` is enabled

This prevents accidental silent or placeholder final exports.

## 5. Tests

```bash
npm run lint
npm run build
npm test
```

`npm test` includes the existing production pipeline regression suite plus a deterministic image-pipeline smoke test. The smoke test does not consume Gemini quota unless explicitly run with `REAL_API_TESTS=1`.

## 6. Generated files

Runtime files under `outputs/` and `temp_renders/` are intentionally ignored by Git. Only the existing demo audio fixture is kept in the repository.

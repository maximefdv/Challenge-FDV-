# Vidéo de démonstration (outillage)

1. Éditer le script : `demo/private/script-video.md` (format décrit en tête du fichier).
2. Voix françaises (Piper, format sherpa-onnx) dans `tools/video/voices/` :
   ```bash
   pip install sherpa-onnx soundfile numpy imageio-ffmpeg
   for v in vits-piper-fr_FR-upmc-medium vits-piper-fr_FR-siwis-medium vits-piper-fr_FR-tom-medium vits-coqui-fr-css10; do
     curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/$v.tar.bz2 | tar xj -C tools/video/voices
   done
   ```
   Voix : `pierre`, `tom`, `gilles` (hommes) · `siwis`, `jessica` (femmes). Choix : `VOIX_COMMERCIAL=gilles VOIX_PROSPECT=siwis`, débit : `VITESSE=1.21`.
3. Générer, enregistrer, monter :
   ```bash
   python tools/video/build.py demo/private/script-video.md demo/private/video.json
   DEMO_FILE=demo/private/video.json PORT=3999 npm start &
   node tools/video/record.mjs demo/private/video.json out/frames
   python tools/video/mux.py demo/private/video.json out/frames out/demo.mp4
   ```
Rythme (pauses, vitesse de parole) : constantes en tête de `build.py`.

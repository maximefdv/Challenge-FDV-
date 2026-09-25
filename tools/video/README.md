# Vidéo de démonstration (outillage)

1. Éditer le script : `demo/private/script-video.md` (format décrit en tête du fichier).
2. Voix françaises (Piper, format sherpa-onnx) dans `tools/video/voices/` :
   ```bash
   pip install sherpa-onnx soundfile numpy imageio-ffmpeg
   for v in fr_FR-tom-medium fr_FR-siwis-medium; do
     curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-$v.tar.bz2 | tar xj -C tools/video/voices
   done
   ```
   Autres voix : `fr_FR-upmc-medium` (Jessica = locuteur 0, Pierre = 1). `VOIX_COMMERCIAL` / `VOIX_PROSPECT` pour changer.
3. Générer, enregistrer, monter :
   ```bash
   python tools/video/build.py demo/private/script-video.md demo/private/video.json
   DEMO_FILE=demo/private/video.json PORT=3999 npm start &
   node tools/video/record.mjs demo/private/video.json out/frames
   python tools/video/mux.py demo/private/video.json out/frames out/demo.mp4
   ```
Rythme (pauses, vitesse de parole) : constantes en tête de `build.py`.

"""Script Markdown -> scénario JSON minuté + voix de synthèse (sherpa-onnx / Piper, voix françaises).

Usage : python tools/video/build.py demo/private/script-video.md demo/private/video.json
Voix  : dossier VOICES_DIR (défaut tools/video/voices) contenant vits-piper-fr_FR-tom-medium, -siwis-medium…
"""
import json, os, re, sys
import numpy as np, sherpa_onnx, soundfile as sf

VOICES_DIR = os.environ.get("VOICES_DIR", "tools/video/voices")
VOIX = {  # rôle -> (modèle, locuteur, vitesse : <1 = plus posé)
    "commercial": (os.environ.get("VOIX_COMMERCIAL", "fr_FR-tom-medium"), 0, 0.96),
    "prospect": (os.environ.get("VOIX_PROSPECT", "fr_FR-siwis-medium"), 0, 0.96),
}
ROLES = {"maxime": "commercial", "commercial": "commercial", "claire": "prospect", "prospect": "prospect"}
INTRO, PAUSE, PAUSE_CARTE, FIN_TRANSCRIPTION = 2.4, 0.9, 2.8, 0.4  # secondes

def parse(md):
    titre, reps, cur = "", [], None
    for raw in md.splitlines():
        line = raw.strip()
        if line.startswith("titre:"):
            titre = line[6:].strip()
        elif line.startswith("## "):
            cur = {"qui": ROLES[line[3:].strip().lower()], "texte": "", "carte": {}, "checklist": []}
            reps.append(cur)
        elif not line or line.startswith("#") or cur is None:
            continue
        elif line.startswith(">"):
            k, _, v = line[1:].partition(":")
            k, v = k.strip(), v.strip()
            if k == "checklist":
                item, _, info = v.partition("=")
                cur["checklist"].append({"item": item.strip(), "info": info.strip()})
            else:
                cur["carte"][k] = v
        else:
            cur["texte"] = (cur["texte"] + " " + line).strip()
    return titre, reps

_tts = {}
def synth(role, texte, out):
    name, sid, speed = VOIX[role]
    if name not in _tts:
        d = f"{VOICES_DIR}/vits-piper-{name}"
        _tts[name] = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{d}/{name}.onnx", tokens=f"{d}/tokens.txt", data_dir=f"{d}/espeak-ng-data"),
            num_threads=4)))
    a = _tts[name].generate(texte, sid=sid, speed=speed)
    s = np.array(a.samples, dtype=np.float32)
    sf.write(out, s, a.sample_rate)
    return len(s) / a.sample_rate

def main(src, dst):
    titre, reps = parse(open(src, encoding="utf8").read())
    audio_dir = os.path.splitext(dst)[0] + "-audio"
    os.makedirs(audio_dir, exist_ok=True)
    cur, out = INTRO, []
    for i, r in enumerate(reps):
        wav = f"{audio_dir}/{i:02d}.wav"
        dur = synth(r["qui"], r["texte"], wav)
        c = r["carte"]
        carte = {"titre": c.get("titre", ""), "reponse": c.get("dire", ""), "preuve": c.get("preuve", ""),
                 "question_rebond": c.get("rebond", ""), "sources": [s.strip() for s in c.get("sources", "").split(",") if s.strip()]} if c else None
        out.append({"qui": r["qui"], "texte": r["texte"], "debut": round(cur * 1000), "t": round((cur + dur + FIN_TRANSCRIPTION) * 1000),
                    "audio": wav, "analyse": {"declencheur": c.get("carte", "aucun") if c else "aucun", "carte": carte, "checklist": r["checklist"]}})
        cur += dur + (PAUSE_CARTE if c else PAUSE)
    json.dump({"titre": titre, "finMs": round((cur + 0.5) * 1000), "repliques": out}, open(dst, "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(f"{len(out)} répliques, {sum(1 for r in out if r['analyse']['carte'])} cartes, fin du RDV à {cur:.1f} s -> {dst}")

if __name__ == "__main__":
    main(*sys.argv[1:3])

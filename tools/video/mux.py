"""Assemble images + voix (chaque réplique placée à son instant 'debut') en MP4 1080p.
Usage : python tools/video/mux.py demo/private/video.json out/frames out/demo.mp4
ffmpeg : variable FFMPEG, sinon imageio-ffmpeg, sinon 'ffmpeg' du PATH."""
import json, os, subprocess, sys

def ffmpeg():
    if os.environ.get("FFMPEG"): return os.environ["FFMPEG"]
    try:
        import imageio_ffmpeg; return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"

scenario, frames, out = sys.argv[1:4]
d = json.load(open(scenario, encoding="utf8"))
duree = d["finMs"] / 1000 + 6
args = [ffmpeg(), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{frames}/list.txt"]
filt = []
for i, r in enumerate(d["repliques"]):
    args += ["-i", r["audio"]]
    filt.append(f"[{i + 1}:a]aresample=48000,adelay={r['debut']}|{r['debut']}[a{i}]")
n = len(d["repliques"])
filt.append("".join(f"[a{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,apad,atrim=0:{duree},loudnorm=I=-16:TP=-1.5,aresample=48000[aout]")
filt.append("[0:v]fps=30,scale=1920:1080:flags=lanczos,format=yuv420p[v]")
args += ["-filter_complex", ";".join(filt), "-map", "[v]", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
         "-c:a", "aac", "-b:a", "160k", "-t", f"{duree}", "-movflags", "+faststart", out]
subprocess.run(args, check=True)
print("->", out)

"""
Titles for the company introduction film: composites typography over the Blender frames and encodes the film.

  python3 3d/intro_titles.py <frames-dir> <out.mp4>             # full film (pipes into ffmpeg)
  python3 3d/intro_titles.py <frames-dir> <out-dir> --stills 60,300  # check a few frames as PNG

Needs Pillow. Fonts are the site's own Plus Jakarta Sans (static instances in 3d/fonts).
"""
import math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

FPS, W, H, SS = 30, 1920, 1080, 2          # SS: supersampling for crisp shapes
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = {w: os.path.join(HERE, "fonts", f"jakarta-{w}.ttf") for w in (500, 700, 800)}
_cache = {}
def font(w, size):
    k = (w, size)
    if k not in _cache:
        _cache[k] = ImageFont.truetype(FONT[w], size * SS)
    return _cache[k]

# dark theme: titles sit on the navy film
NAVY, BLUE, SKY, YELLOW, GREEN, RED, INK = "#0B1F3A", "#2563EB", "#6EA8FF", "#FFC83D", "#3DD47A", "#FF6B6B", "#B9C9E2"
HEAD, ACC = "#FFFFFF", "#7FB0FF"
def rgb(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def expo_out(x):
    x = max(0.0, min(1.0, x))
    return 1 - 2 ** (-10 * x) if x < 1 else 1.0

def ease_in(x):
    x = max(0.0, min(1.0, x))
    return x * x

# ------------------------------------------------------------------ copy and timing (seconds), matched to build_film.py; the copy is the client's own
CHAPTERS = [
    dict(t0=0.0, t1=6.0, logo=True, title=("Practical QA skills.", "Reliable software quality."),
         sub="Two connected services: industry-ready QA training and offshore software testing."),
    dict(t0=6.0, t1=12.0, chip=("01", "Foundation programme"), title=("Start with the", "fundamentals."),
         sub="A beginner-friendly pathway for learners starting their journey in software testing.",
         meta="3 months  ·  3 classes a week  ·  1 hour per class"),
    dict(t0=12.0, t1=18.0, chip=("02", "Advanced programme"), title=("Build professional", "QA skills."),
         sub="For learners with manual testing knowledge who are ready to develop technical QA skills.",
         meta="3 months  ·  3 classes a week  ·  1 hour per class"),
    dict(t0=18.0, t1=24.0, chip=("03", "Practical learning"), title=("One continuous, realistic", "e-commerce project."),
         sub="Follow a customer journey and practise testing from product discovery to order completion.",
         meta="Understand  ·  Practise  ·  Review  ·  Build confidence", journey=True),
    dict(t0=24.0, t1=30.0, chip=("04", "Offshore testing services"), title=("Manual testing.", "Automation testing."),
         sub="Flexible QA support for businesses across the software testing lifecycle."),
    dict(t0=30.0, t1=36.0, chip=("05", "End-to-end QA support"), title=("From requirements", "to release confidence."),
         sub="We work alongside your team with practical QA support, clear communication and meaningful testing insights."),
    dict(t0=36.0, t1=42.0, end=True),
]
JOURNEY = ["Search", "Product", "Cart", "Login", "Address", "Delivery", "Payment", "Order"]
J0, JSTEP = 18.5, 0.62   # step i lights at J0 + i*JSTEP, as the camera reaches its screen

# ------------------------------------------------------------------ drawing helpers (all coordinates in 1920×1080 space)
def S(v):
    return int(round(v * SS))

def text(d, xy, s, w, size, fill, alpha):
    if alpha <= 0:
        return
    d.text((S(xy[0]), S(xy[1])), s, font=font(w, size), fill=rgb(fill, int(255 * alpha)))

def tracked(d, xy, s, w, size, fill, alpha, track):
    x = xy[0]
    for ch in s:
        text(d, (x, xy[1]), ch, w, size, fill, alpha)
        x += font(w, size).getlength(ch) / SS + track
    return x

def width(s, w, size):
    return font(w, size).getlength(s) / SS

def wrap(s, w, size, maxw):
    lines, cur = [], ""
    for word in s.split():
        t = (cur + " " + word).strip()
        if cur and width(t, w, size) > maxw:
            lines.append(cur)
            cur = word
        else:
            cur = t
    return lines + [cur]

def pill(d, x, y, label, alpha, fill="#12294A", fg="#EAF1FB", border="#2D5285", size=24, padx=22, h=52):
    tw = width(label, 700, size)
    if alpha > 0:
        d.rounded_rectangle((S(x), S(y), S(x + tw + 2 * padx), S(y + h)), radius=S(h / 2),
                            fill=rgb(fill, int(255 * alpha)), outline=rgb(border, int(255 * alpha)) if border else None, width=S(1.5))
        text(d, (x + padx, y + (h - size * 1.28) / 2), label, 700, size, fg, alpha)
    return tw + 2 * padx

def logo(d, x, y, size, alpha):
    """The Genix mark (80-unit viewBox): blue G and yellow check, as in components/Logo.tsx."""
    if alpha <= 0:
        return
    k = size / 80
    def P(px, py):
        return (S(x + px * k), S(y + py * k))
    blue, yellow = rgb(BLUE, int(255 * alpha)), rgb(YELLOW, int(255 * alpha))
    cx, cy, r, sw = 40, 40, 28, 10
    box = (S(x + (cx - r) * k), S(y + (cy - r) * k), S(x + (cx + r) * k), S(y + (cy + r) * k))
    d.arc(box, start=0, end=315, fill=blue, width=S(sw * k))
    for px, py in ((59.8, 20.2), (68, 40), (50, 40)):
        c = P(px, py)
        d.ellipse((c[0] - S(sw * k / 2), c[1] - S(sw * k / 2), c[0] + S(sw * k / 2), c[1] + S(sw * k / 2)), fill=blue)
    d.line([P(68, 40), P(50, 40)], fill=blue, width=S(sw * k))
    pts = [P(25, 39), P(34, 48), P(50, 27)]
    d.line(pts, fill=yellow, width=S(9 * k), joint="curve")
    for c in (pts[0], pts[-1]):
        d.ellipse((c[0] - S(4.5 * k), c[1] - S(4.5 * k), c[0] + S(4.5 * k), c[1] + S(4.5 * k)), fill=yellow)

def lockup(d, x, y, size, alpha):
    logo(d, x, y, size, alpha)
    text(d, (x + size * 1.08, y + size * 0.05), "Genix", 800, int(size * 0.5), HEAD, alpha)
    tracked(d, (x + size * 1.1, y + size * 0.62), "SOLUTIONS", 700, int(size * 0.17), ACC, alpha, size * 0.05)

# ------------------------------------------------------------------ the wash: full strength behind the type, easing to nothing by ~60% width
_wash = {}
def wash_layer(strength, kind="side"):
    """side: behind the titles, easing out by ~62% width. end: wider, for the closing card. foot: a band under the journey strip."""
    import numpy as np
    if kind not in _wash:
        if kind == "foot":
            y = np.linspace(0, 1, S(H))
            f = np.clip((y - 0.70) / (0.84 - 0.70), 0, 1)
            f = f * f * (3 - 2 * f)
            _wash[kind] = (np.tile(f[:, None], (1, S(W))) * 0.78).astype("float32")
        else:
            lo, hi, k = (0.26, 0.62, 0.82) if kind == "side" else (0.42, 0.86, 0.86)
            x = np.linspace(0, 1, S(W))
            f = np.clip((x - lo) / (hi - lo), 0, 1)
            f = 1 - f * f * (3 - 2 * f)
            _wash[kind] = (np.tile(f, (S(H), 1)) * k).astype("float32")
    a = Image.fromarray((_wash[kind] * strength * 255).astype("uint8"))
    layer = Image.new("RGBA", (S(W), S(H)), rgb("#061224"))
    layer.putalpha(a)
    return layer

# ------------------------------------------------------------------ one frame of titles
X0 = 120

def appear(t, start, dur=0.9):
    return expo_out((t - start) / dur)

def scrim(t, ch):
    """Soft left-to-right wash behind the titles (a gradient, not a flat overlay)."""
    a_in = expo_out((t - ch["t0"]) / 0.6) if ch["t0"] > 0 else 1.0
    a_out = 1 - ease_in((t - (ch["t1"] - 0.35)) / 0.35) if not ch.get("end") else 1.0
    return max(0.0, min(a_in, a_out))

def draw_titles(t):
    img = Image.new("RGBA", (S(W), S(H)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ch = next(c for c in CHAPTERS if c["t0"] <= t < c["t1"] or (c is CHAPTERS[-1] and t >= c["t0"]))
    out = 1.0 if ch.get("end") else 1 - ease_in((t - (ch["t1"] - 0.35)) / 0.35)
    base = ch["t0"] + (0.25 if ch["t0"] > 0 else 0.4)
    k = [0]
    def nxt(gap=0.08):
        k[0] += 1
        return base + (k[0] - 1) * gap
    def a_y(start, rise=26):
        p = appear(t, start)
        return p * out, (1 - p) * rise

    # wash
    sa = scrim(t, ch)
    if sa > 0:
        img.alpha_composite(wash_layer(sa, "end" if ch.get("end") else "side"), (0, 0))
        if ch.get("journey"):
            img.alpha_composite(wash_layer(sa, "foot"), (0, 0))
        d = ImageDraw.Draw(img)

    if ch.get("end"):
        a, dy = a_y(nxt(0.12))
        lockup(d, X0, 268 + dy, 110, a)
        a, dy = a_y(nxt(0.12))
        text(d, (X0, 440 + dy), "Build your QA skills.", 800, 64, HEAD, a)
        a, dy = a_y(nxt(0.12))
        text(d, (X0, 520 + dy), "Strengthen your software quality.", 800, 64, ACC, a)
        a, dy = a_y(nxt(0.12))
        wpx = pill(d, X0, 650 + dy, "Explore our programmes", a, fill=YELLOW, fg=NAVY, border=None, size=26, padx=30, h=66)
        pill(d, X0 + wpx + 18, 650 + dy, "Discuss testing services", a, fill="#0F2747", fg=HEAD, border="#6EA8FF", size=26, padx=30, h=66)
        a, dy = a_y(nxt(0.12))
        tracked(d, (X0, 780 + dy), "LEARN  ·  TEST  ·  IMPROVE", 700, 22, ACC, a, 3)
        return img

    y = 216 if ch.get("journey") else 286   # three lines of copy and the strip below: start higher
    if ch.get("logo"):
        a, dy = a_y(nxt())
        lockup(d, X0, 190 + dy, 84, a)
        y = 340
    if ch.get("chip"):
        a, dy = a_y(nxt())
        n, label = ch["chip"]
        wpx = pill(d, X0, y + dy, f"{n}", a, fill=YELLOW, fg=NAVY, border=None, size=22, padx=18, h=46)
        text(d, (X0 + wpx + 16, y + 9 + dy), label.upper(), 700, 22, YELLOW, a)
        y += 78
    for i, line in enumerate(ch["title"]):
        a, dy = a_y(nxt(), 34)
        text(d, (X0, y + dy), line, 800, 66, HEAD if i == 0 else ACC, a)
        y += 80
    y += 22
    if ch.get("sub"):
        a, dy = a_y(nxt())
        for line in wrap(ch["sub"], 500, 29, 700):
            text(d, (X0, y + dy), line, 500, 29, INK, a)
            y += 42
        y += 22
    if ch.get("meta"):
        a, dy = a_y(nxt())
        text(d, (X0, y + dy), ch["meta"], 700, 24, YELLOW, a)
    if ch.get("journey"):
        # the eight stops, lighting up as the camera reaches each screen
        n, gap = len(JOURNEY), 26
        bw = (W - 2 * X0 - (n - 1) * gap) / n
        for i, name in enumerate(JOURNEY):
            a, dy = a_y(nxt(0.05), 16)
            lit = t >= J0 + i * JSTEP
            bad = name == "Payment" and lit and t < J0 + 7 * JSTEP + 0.25
            x0, y0 = X0 + i * (bw + gap), 920 + dy
            if a > 0:
                border = (RED if bad else YELLOW) if lit else "#2D5285"
                d.rounded_rectangle((S(x0), S(y0), S(x0 + bw), S(y0 + 84)), radius=S(16), fill=rgb("#12305A" if lit else "#0D2240", int(235 * a)),
                                    outline=rgb(border, int(255 * a)), width=S(2))
                text(d, (x0 + 18, y0 + 12), f"{i + 1:02d}", 700, 18, (RED if bad else YELLOW) if lit else SKY, a)
                text(d, (x0 + 18, y0 + 40), name, 700, 24, HEAD if lit else INK, a)
                if i:
                    cx, cy = x0 - gap / 2, y0 + 42
                    d.line([(S(cx - 4), S(cy - 7)), (S(cx + 3), S(cy)), (S(cx - 4), S(cy + 7))], fill=rgb(SKY, int(200 * a)), width=S(2.5))
    return img

def compose(frame_png, t):
    base = Image.open(frame_png).convert("RGBA")
    if base.size != (W, H):
        base = base.resize((W, H), Image.LANCZOS)
    titles = draw_titles(t).resize((W, H), Image.LANCZOS)
    base.alpha_composite(titles)
    return base.convert("RGB")

def main():
    src, out = sys.argv[1], sys.argv[2]
    frames = sorted(f for f in os.listdir(src) if f.startswith("f") and f.endswith(".png"))
    if "--stills" in sys.argv:
        os.makedirs(out, exist_ok=True)
        for n in [int(v) for v in sys.argv[sys.argv.index("--stills") + 1].split(",")]:
            fp = os.path.join(src, f"f{n:04d}.png")
            if not os.path.exists(fp):
                fp = os.path.join(src, f"still_{n:04d}.png")
            compose(fp, (n - 1) / FPS).save(os.path.join(out, f"titled_{n:04d}.png"))
        return
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", out],
                          stdin=subprocess.PIPE)
    # --follow: composite while Blender is still writing frames (waits for each file in turn)
    follow = "--follow" in sys.argv
    total = FPS * 42
    names = [f"f{n:04d}.png" for n in range(1, total + 1)] if follow else frames
    import time
    for i, f in enumerate(names):
        fp = os.path.join(src, f)
        nxt = os.path.join(src, f"f{int(f[1:5]) + 1:04d}.png")
        while follow and not (os.path.exists(nxt) or (os.path.exists(fp) and int(f[1:5]) == total and time.time() - os.path.getmtime(fp) > 3)):
            time.sleep(0.5)
        n = int(f[1:5])
        ff.stdin.write(compose(fp, (n - 1) / FPS).tobytes())
        if i % 120 == 0:
            print("frame", n, flush=True)
    ff.stdin.close()
    ff.wait()

if __name__ == "__main__":
    main()

"""
Titles for "The Quality Line" intro: composites typography over the Blender frames and encodes the film.

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

NAVY, BLUE, SKY, YELLOW, GREEN, RED, INK = "#0B1F3A", "#2563EB", "#6EA8FF", "#FFC83D", "#2DB86A", "#F0524F", "#4A5B75"
def rgb(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def expo_out(x):
    x = max(0.0, min(1.0, x))
    return 1 - 2 ** (-10 * x) if x < 1 else 1.0

def ease_in(x):
    x = max(0.0, min(1.0, x))
    return x * x

# ------------------------------------------------------------------ copy and timing (seconds), matched to build_intro.py
CHAPTERS = [
    dict(t0=0.0, t1=5.0, logo=True, title=("Practical QA training.", "Reliable software testing."),
         meta="QA training for learners · Testing services for businesses"),
    dict(t0=5.0, t1=13.0, chip=("01", "Foundation programme"), title=("Start with the", "fundamentals."),
         pills=["SDLC & Agile", "Requirements", "Test cases", "Functional & regression", "Defects"],
         meta="3 months · 3 live classes a week · 1 hour each"),
    dict(t0=13.0, t1=21.0, chip=("02", "Advanced programme"), title=("Build technical", "QA skills."),
         pills=["API testing", "SQL & databases", "Test automation", "Git & CI/CD"],
         meta="3 months · for learners with manual testing knowledge"),
    dict(t0=21.0, t1=30.0, chip=("03", "One real project"), title=("Test one e-commerce app,", "end to end."),
         journey=True),
    dict(t0=30.0, t1=37.0, chip=("04", "Testing services"), title=("Manual and automation", "testing for your product."),
         pills=["Functional", "Regression", "API & integration", "Automation suites", "Release support"]),
    dict(t0=37.0, t1=42.0, end=True),
]
T_STOP, T_GO = 22.4, 27.4

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

def pill(d, x, y, label, alpha, fill="#FFFFFF", fg=NAVY, border="#C9D7EC", size=24, padx=22, h=52):
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
    text(d, (x + size * 1.08, y + size * 0.05), "Genix", 800, int(size * 0.5), NAVY, alpha)
    tracked(d, (x + size * 1.1, y + size * 0.62), "SOLUTIONS", 700, int(size * 0.17), BLUE, alpha, size * 0.05)

# ------------------------------------------------------------------ the wash: full strength behind the type, easing to nothing by ~60% width
_wash = None
def wash_layer(strength):
    global _wash
    if _wash is None:
        import numpy as np
        x = np.linspace(0, 1, S(W))
        f = np.clip((x - 0.26) / (0.62 - 0.26), 0, 1)
        f = 1 - f * f * (3 - 2 * f)
        _wash = (np.tile(f, (S(H), 1)) * 0.82).astype("float32")
    import numpy as np
    a = Image.fromarray((_wash * strength * 255).astype("uint8"))
    layer = Image.new("RGBA", (S(W), S(H)), rgb("#F2F6FC"))
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
        img.alpha_composite(wash_layer(sa), (0, 0))
        d = ImageDraw.Draw(img)

    if ch.get("end"):
        a, dy = a_y(nxt(0.12))
        lockup(d, X0, 330 + dy, 120, a)
        a, dy = a_y(nxt(0.12))
        text(d, (X0, 510 + dy), "Build QA skills.", 800, 66, NAVY, a)
        a, dy = a_y(nxt(0.12))
        text(d, (X0, 592 + dy), "Deliver better software.", 800, 66, BLUE, a)
        a, dy = a_y(nxt(0.12))
        text(d, (X0, 720 + dy), "QA training  ·  Offshore software testing", 600 if False else 500, 30, INK, a)
        return img

    y = 300 if ch.get("logo") else 286
    if ch.get("logo"):
        a, dy = a_y(nxt())
        lockup(d, X0, 170 + dy, 84, a)
        y = 330
    if ch.get("chip"):
        a, dy = a_y(nxt())
        n, label = ch["chip"]
        wpx = pill(d, X0, y + dy, f"{n}", a, fill=NAVY, fg="#FFFFFF", border=None, size=22, padx=18, h=46)
        text(d, (X0 + wpx + 16, y + 9 + dy), label.upper(), 700, 22, BLUE, a)
        y += 78
    for i, line in enumerate(ch["title"]):
        a, dy = a_y(nxt(), 34)
        text(d, (X0, y + dy), line, 800, 70, NAVY if i == 0 else BLUE, a)
        y += 86
    y += 26
    if ch.get("pills"):
        x, row = X0, 0
        for p in ch["pills"]:
            a, dy = a_y(nxt(0.07), 18)
            tw = width(p, 700, 24) + 44
            if x + tw > X0 + 760:
                x, row = X0, row + 1
            pill(d, x, y + row * 64 + dy, p, a)
            x += tw + 12
        y += (row + 1) * 64 + 18
    if ch.get("meta"):
        a, dy = a_y(nxt())
        text(d, (X0, y + dy), ch["meta"], 500, 28, INK, a)
    if ch.get("journey"):
        steps = ["Search", "Product", "Cart", "Payment", "Order"]
        x = X0
        for i, s in enumerate(steps):
            a, dy = a_y(nxt(0.09), 18)
            fill, fg, border = "#FFFFFF", NAVY, "#C9D7EC"
            if s == "Payment":
                red = expo_out((t - (T_STOP - 0.6)) / 0.4) * (1 - expo_out((t - (T_GO - 0.9)) / 0.4))
                green = expo_out((t - (T_GO - 0.9)) / 0.4)
                if red > 0.5:
                    fill, fg, border = RED, "#FFFFFF", None
                elif green > 0.5:
                    fill, fg, border = GREEN, "#FFFFFF", None
            wpx = pill(d, x, y + dy, s, a, fill=fill, fg=fg, border=border)
            x += wpx
            if i < len(steps) - 1 and a > 0:
                d.line([(S(x + 6), S(y + 26 + dy)), (S(x + 22), S(y + 26 + dy))], fill=rgb(SKY, int(255 * a)), width=S(3))
                x += 28
        y += 84
        # what happens on the line, in one caption that changes with the story
        cap_a, dy = a_y(nxt(), 12)
        if t < T_STOP - 0.6:
            cap, col = "Every screen goes through the same customer journey.", INK
        elif t < T_GO - 0.9:
            cap, col = "Line stopped: payment retry charges the customer twice.", RED
        else:
            cap, col = "Fixed, retested, back on the line.", GREEN
        text(d, (X0, y + dy), cap, 700, 28, col, cap_a)
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

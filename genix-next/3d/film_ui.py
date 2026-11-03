"""
Screens for the intro film: realistic QA tool UIs drawn in the site's palette (navy, blue, sky, yellow),
one PNG per screen state. build_film.py places them as panels in 3D space.

  python3 3d/film_ui.py <outdir>
"""
import os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "3d/out/film-ui")
os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
S = 2  # supersample: every size below is in "design pixels", drawn at 2x

def F(w, size):
    return ImageFont.truetype(os.path.join(HERE, "fonts", f"jakarta-{w}.ttf"), int(size * S))
def M(size):
    return ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", int(size * S))

NAVY, CARD, CARD2, LINE = "#0B1F3A", "#0F2747", "#14325A", "#244A7A"
TXT, MUTED, BLUE, SKY, YEL, GREEN, RED = "#EAF1FB", "#8FA9D0", "#2563EB", "#6EA8FF", "#FFC83D", "#2DB86A", "#F0524F"

def rgba(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

class Card:
    """A panel: soft blue glow, rounded body, window bar with dots and a title."""
    PAD = 40
    def __init__(self, w, h, title=None, bar=True, body=CARD):
        self.w, self.h = w, h
        P = self.PAD
        self.img = Image.new("RGBA", ((w + 2 * P) * S, (h + 2 * P) * S), (0, 0, 0, 0))
        glow = Image.new("RGBA", self.img.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).rounded_rectangle(self.box(0, 0, w, h), radius=22 * S, fill=rgba(BLUE, 70))
        self.img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18 * S)))
        self.d = ImageDraw.Draw(self.img)
        self.d.rounded_rectangle(self.box(0, 0, w, h), radius=20 * S, fill=rgba(body), outline=rgba(LINE), width=2 * S)
        self.top = 0
        if bar:
            self.d.rounded_rectangle(self.box(0, 0, w, 52), radius=20 * S, fill=rgba(CARD2))
            self.d.rectangle(self.box(0, 30, w, 52), fill=rgba(CARD2))
            self.d.line([self.p(0, 52), self.p(w, 52)], fill=rgba(LINE), width=2 * S)
            for i, c in enumerate((RED, YEL, GREEN)):
                x = 26 + i * 20
                self.d.ellipse(self.box(x - 6, 20, x + 6, 32), fill=rgba(c))
            if title:
                self.text(96, 15, title, 700, 17, MUTED)
            self.top = 52

    def p(self, x, y):
        return ((x + self.PAD) * S, (y + self.PAD) * S)
    def box(self, x0, y0, x1, y1):
        return (*self.p(x0, y0), *self.p(x1, y1))
    def text(self, x, y, s, w, size, fill, mono=False, anchor="la"):
        self.d.text(self.p(x, y), s, font=M(size) if mono else F(w, size), fill=rgba(fill), anchor=anchor)
    def width(self, s, w, size, mono=False):
        return (M(size) if mono else F(w, size)).getlength(s) / S
    def pill(self, x, y, s, fg, bg, size=14, h=28, padx=12):
        tw = self.width(s, 700, size)
        self.d.rounded_rectangle(self.box(x, y, x + tw + 2 * padx, y + h), radius=h * S // 2, fill=rgba(bg))
        self.text(x + padx, y + (h - size * 1.3) / 2, s, 700, size, fg)
        return tw + 2 * padx
    def rect(self, x0, y0, x1, y1, fill, r=10, outline=None):
        self.d.rounded_rectangle(self.box(x0, y0, x1, y1), radius=r * S, fill=rgba(fill) if isinstance(fill, str) else fill,
                                 outline=rgba(outline) if outline else None, width=2 * S if outline else 0)
    def save(self, name):
        self.img.save(os.path.join(OUT, name + ".png"))

def tick(c, x, y, colour=GREEN, r=11):
    c.d.ellipse(c.box(x - r, y - r, x + r, y + r), fill=rgba(colour))
    c.d.line([c.p(x - 5, y), c.p(x - 1, y + 4), c.p(x + 6, y - 5)], fill=rgba("#FFFFFF"), width=3 * S, joint="curve")

def cross(c, x, y, r=11):
    c.d.ellipse(c.box(x - r, y - r, x + r, y + r), fill=rgba(RED))
    c.d.line([c.p(x - 4, y - 4), c.p(x + 4, y + 4)], fill=rgba("#FFFFFF"), width=3 * S)
    c.d.line([c.p(x + 4, y - 4), c.p(x - 4, y + 4)], fill=rgba("#FFFFFF"), width=3 * S)

# ------------------------------------------------------------------ 1 · test cases (Foundation): rows pass one by one, the payment case fails
CASES = [("TC-101", "Search returns matching products"), ("TC-102", "Filter by price and brand"), ("TC-103", "Add item to cart"),
         ("TC-104", "Apply coupon at checkout"), ("TC-105", "Retry a declined payment")]
for state in range(7):
    c = Card(760, 470, "Test cases  ·  Checkout regression")
    c.text(28, 76, "ID", 700, 13, MUTED); c.text(130, 76, "SCENARIO", 700, 13, MUTED); c.text(610, 76, "STATUS", 700, 13, MUTED)
    for i, (tid, name) in enumerate(CASES):
        y = 108 + i * 68
        c.rect(16, y, 744, y + 56, CARD2 if i % 2 == 0 else CARD, r=12)
        c.text(28, y + 17, tid, 700, 15, SKY, mono=True)
        c.text(130, y + 16, name, 600 if False else 500, 17, TXT)
        if i < state and not (i == 4 and state >= 5):
            c.pill(600, y + 14, "Passed", "#FFFFFF", GREEN)
        elif i == 4 and state >= 5:
            c.pill(600, y + 14, "Failed", "#FFFFFF", RED)
        elif i == state:
            c.pill(600, y + 14, "Running", NAVY, YEL)
        else:
            c.pill(600, y + 14, "Not run", MUTED, "#1C3A63")
    c.save(f"cases_{state}")

# the defect raised from TC-105
c = Card(560, 360, "BUG-142")
c.pill(28, 74, "High", "#FFFFFF", RED); c.pill(104, 74, "Payment", SKY, "#1C3A63")
c.text(28, 122, "Customer charged twice", 800, 26, TXT)
c.text(28, 156, "after a payment retry", 800, 26, TXT)
for i, s in enumerate(["1. Add any item to the cart", "2. Pay with a card that is declined", "3. Retry the payment"]):
    c.text(28, 208 + i * 30, s, 500, 16, MUTED)
c.text(28, 308, "Expected: 1 charge     Actual: 2 charges", 700, 15, YEL, mono=True)
c.save("bug")

# ------------------------------------------------------------------ 2 · Advanced: API request, SQL check, automated run
c = Card(700, 420, "Payments API")
c.pill(28, 72, "POST", NAVY, YEL, size=13)
c.text(100, 75, "/api/payments/retry", 700, 18, TXT, mono=True)
c.pill(520, 72, "201 Created", "#FFFFFF", GREEN, size=13)
c.text(28, 122, "RESPONSE  ·  184 ms", 700, 13, MUTED)
c.rect(28, 146, 672, 300, "#0A1C36", r=12)
for i, (k, v, col) in enumerate([('"orderId"', '"ORD-2087"', YEL), ('"status"', '"PAID"', GREEN), ('"charges"', "1", SKY)]):
    c.text(48, 166 + i * 38, f"{k}:", 400, 17, SKY, mono=True)
    c.text(48 + c.width(f"{k}: ", 400, 17, mono=True), 166 + i * 38, v, 400, 17, col, mono=True)
for i, s in enumerate(["status is 201", "exactly one charge for the order"]):
    tick(c, 40, 334 + i * 36); c.text(62, 324 + i * 36, s, 500, 16, TXT)
c.save("api")

c = Card(640, 360, "orders.sql")
for i, (kw, rest) in enumerate([("SELECT", " order_id, amount, status"), ("FROM", " payments"), ("WHERE", " order_id = 'ORD-2087';")]):
    c.text(28, 76 + i * 32, kw, 400, 17, YEL, mono=True)
    c.text(28 + c.width(kw, 400, 17, mono=True), 76 + i * 32, rest, 400, 17, TXT, mono=True)
c.rect(28, 186, 612, 230, CARD2, r=8)
for x, h in ((44, "order_id"), (250, "amount"), (440, "status")):
    c.text(x, 198, h, 700, 14, MUTED, mono=True)
for x, v, col in ((44, "ORD-2087", TXT), (250, "2,499.00", TXT), (440, "PAID", GREEN)):
    c.text(x, 246, v, 400, 16, col, mono=True)
c.text(28, 302, "1 row  ·  one payment recorded", 700, 15, GREEN)
c.save("sql")

LINES = [("search.spec.ts", 4), ("filters.spec.ts", 3), ("cart.spec.ts", 6), ("checkout.spec.ts", 5), ("payment-retry.spec.ts", 3)]
for state in range(len(LINES) + 2):
    c = Card(680, 420, "Terminal  ·  playwright")
    c.text(28, 74, "$", 400, 16, GREEN, mono=True); c.text(48, 74, "npx playwright test e2e/", 400, 16, TXT, mono=True)
    for i, (f, n) in enumerate(LINES[:state]):
        y = 116 + i * 40
        tick(c, 38, y + 10, r=10)
        c.text(60, y, f, 400, 16, TXT, mono=True)
        c.text(470, y, f"{n} passed", 400, 15, MUTED, mono=True)
    if state > len(LINES):
        c.rect(28, 330, 652, 384, "#103A2E", r=10)
        c.text(46, 345, "21 passed", 800, 18, GREEN); c.text(170, 347, "0 failed  ·  38.2s", 500, 16, MUTED)
    c.save(f"run_{state}")

# ------------------------------------------------------------------ 3 · the project: five shop screens; payment goes red, then green
def browser(w, h, url):
    c = Card(w, h, None)
    c.rect(96, 14, w - 28, 38, "#0A1C36", r=12)
    c.text(112, 17, url, 500, 13, MUTED, mono=True)
    return c

c = browser(360, 460, "shop.test/search?q=shoes")
c.rect(24, 74, 336, 116, "#0A1C36", r=12); c.text(44, 86, "running shoes", 500, 16, TXT)
for i in range(4):
    x, y = 24 + (i % 2) * 162, 136 + (i // 2) * 150
    c.rect(x, y, x + 150, y + 136, CARD2, r=12); c.rect(x + 12, y + 12, x + 138, y + 84, ("#1F4D8F", "#2B5FA8", "#1F4D8F", "#2B5FA8")[i], r=8)
    c.rect(x + 12, y + 96, x + 110, y + 106, "#2E5585", r=4); c.text(x + 12, y + 112, "₹" if False else "Rs " + ("2,499", "1,999", "3,299", "2,799")[i], 700, 13, YEL)
c.text(24, 430, "Search", 800, 18, TXT)
c.save("shop_search")

c = browser(360, 460, "shop.test/p/trail-runner")
c.rect(24, 72, 336, 250, "#2B5FA8", r=14); c.d.ellipse(c.box(140, 120, 220, 200), fill=rgba("#6EA8FF", 180))
c.text(24, 268, "Trail Runner 2", 800, 20, TXT); c.text(24, 300, "Rs 2,499", 800, 22, YEL)
c.rect(24, 346, 336, 392, BLUE, r=12); c.text(180, 369, "Add to cart", 800, 16, "#FFFFFF", anchor="mm")
c.text(24, 430, "Product", 800, 18, TXT)
c.save("shop_product")

c = browser(360, 460, "shop.test/cart")
for i, (n, p) in enumerate([("Trail Runner 2", "2,499"), ("Socks, 3 pack", "399")]):
    y = 76 + i * 76
    c.rect(24, y, 336, y + 64, CARD2, r=12); c.rect(36, y + 10, 80, y + 54, "#2B5FA8", r=8)
    c.text(94, y + 12, n, 700, 15, TXT); c.text(94, y + 36, "Rs " + p, 700, 14, YEL)
c.text(24, 250, "Coupon  QA10", 500, 15, MUTED, mono=True); c.pill(250, 246, "-10%", "#FFFFFF", GREEN, size=12, h=24)
c.line = None
c.text(24, 300, "Total", 700, 18, TXT); c.text(336, 300, "Rs 2,608", 800, 18, YEL, anchor="ra")
c.rect(24, 346, 336, 392, BLUE, r=12); c.text(180, 369, "Checkout", 800, 16, "#FFFFFF", anchor="mm")
c.text(24, 430, "Cart", 800, 18, TXT)
c.save("shop_cart")

for state, (banner, col) in enumerate([(None, None), ("Charged twice on retry", RED), ("Retested: one charge", GREEN)]):
    c = browser(360, 460, "shop.test/checkout/pay")
    c.text(24, 76, "Card number", 500, 13, MUTED)
    c.rect(24, 98, 336, 138, "#0A1C36", r=10); c.text(40, 109, "4111  ••••  ••••  1111", 400, 15, TXT, mono=True)
    c.text(24, 154, "Expiry", 500, 13, MUTED); c.text(190, 154, "CVV", 500, 13, MUTED)
    c.rect(24, 176, 170, 214, "#0A1C36", r=10); c.rect(190, 176, 336, 214, "#0A1C36", r=10)
    c.text(40, 186, "08/28", 400, 15, TXT, mono=True); c.text(206, 186, "•••", 400, 15, TXT, mono=True)
    c.rect(24, 236, 336, 282, YEL, r=12); c.text(180, 259, "Pay Rs 2,608", 800, 16, NAVY, anchor="mm")
    if banner:
        c.rect(24, 300, 336, 354, col, r=12)
        (tick if col == GREEN else cross)(c, 48, 327)
        c.text(68, 316, banner, 800, 15, "#FFFFFF")
    c.text(24, 430, "Payment", 800, 18, TXT)
    c.save(f"shop_pay_{state}")

c = browser(360, 460, "shop.test/order/ORD-2087")
tick(c, 180, 150, r=40)
c.text(180, 222, "Order confirmed", 800, 22, TXT, anchor="mm"); c.text(180, 256, "ORD-2087", 400, 16, SKY, mono=True, anchor="mm")
c.rect(24, 300, 336, 380, CARD2, r=12); c.text(40, 314, "Paid", 500, 14, MUTED); c.text(320, 314, "Rs 2,608", 800, 14, YEL, anchor="ra")
c.text(40, 346, "Charges", 500, 14, MUTED); c.text(320, 346, "1", 800, 14, GREEN, anchor="ra")
c.text(24, 430, "Order", 800, 18, TXT)
c.save("shop_order")

# ------------------------------------------------------------------ 4 · services: pipeline lighting up, and the run summary
STAGES = ["Build", "Unit tests", "API tests", "UI regression", "Release"]
for state in range(len(STAGES) + 1):
    c = Card(980, 230, "Pipeline  ·  release/2.4")
    for i, s in enumerate(STAGES):
        x = 40 + i * 190
        done, running = i < state, i == state
        if i:
            c.d.line([c.p(x - 120, 140), c.p(x - 4, 140)], fill=rgba(GREEN if done else LINE), width=4 * S)
        col = GREEN if done else (YEL if running else "#1C3A63")
        c.d.ellipse(c.box(x - 4, 116, x + 44, 164), fill=rgba(col))
        if done:
            c.d.line([c.p(x + 9, 141), c.p(x + 17, 149), c.p(x + 31, 131)], fill=rgba("#FFFFFF"), width=4 * S, joint="curve")
        c.text(x + 20, 182, s, 700, 15, TXT if (done or running) else MUTED, anchor="ma")
    c.save(f"pipe_{state}")

c = Card(520, 300, "Test run summary")
c.text(28, 76, "248", 800, 54, TXT); c.text(150, 98, "tests", 500, 18, MUTED)
for i, (lab, val, col) in enumerate([("Passed", "246", GREEN), ("Fixed & retested", "2", SKY), ("Open defects", "0", YEL)]):
    y = 160 + i * 40
    c.d.ellipse(c.box(30, y + 6, 42, y + 18), fill=rgba(col)); c.text(54, y, lab, 500, 16, TXT); c.text(490, y, val, 800, 16, col, anchor="ra")
c.save("summary")

# ------------------------------------------------------------------ backdrop: deep navy with a soft blue bloom
W, H = 3840, 2160
bg = Image.new("RGBA", (W, H), rgba("#071427"))
bloom = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(bloom).ellipse((W * .45, H * .05, W * 1.05, H * .9), fill=rgba("#1D4ED8", 120))
ImageDraw.Draw(bloom).ellipse((-W * .2, H * .55, W * .35, H * 1.3), fill=rgba("#0EA5E9", 50))
bg.alpha_composite(bloom.filter(ImageFilter.GaussianBlur(260)))
bg.convert("RGB").save(os.path.join(OUT, "backdrop.png"))

# ------------------------------------------------------------------ the logo mark (for the last shot)
L = Image.new("RGBA", (800, 800), (0, 0, 0, 0))
ld = ImageDraw.Draw(L)
k = 10
ld.arc((120, 120, 680, 680), start=0, end=315, fill=rgba(BLUE), width=100)
for px, py in ((59.8, 20.2), (68, 40), (50, 40)):
    ld.ellipse((px * k - 50, py * k - 50, px * k + 50, py * k + 50), fill=rgba(BLUE))
ld.line([(680, 400), (500, 400)], fill=rgba(BLUE), width=100)
ld.line([(250, 390), (340, 480), (500, 270)], fill=rgba(YEL), width=90, joint="curve")
for px, py in ((250, 390), (500, 270)):
    ld.ellipse((px - 45, py - 45, px + 45, py + 45), fill=rgba(YEL))
L.save(os.path.join(OUT, "logo.png"))
print("UI DONE", len(os.listdir(OUT)))

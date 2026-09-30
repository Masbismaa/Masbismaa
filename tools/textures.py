"""Generate the photographic-ish textures used by the 3D school scene.

    python tools/textures.py --fonts /path/to/google-fonts --out assets/textures

Needs numpy and Pillow. The fonts folder must contain (Google Fonts layout):
  ofl/delagothicone/DelaGothicOne-Regular.ttf
  apache/permanentmarker/PermanentMarker-Regular.ttf
  ofl/ibmplexmono/IBMPlexMono-Bold.ttf
Every texture tiles horizontally; most tile in both directions.
"""
import argparse
import pathlib

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

rng = np.random.default_rng(3)


# ---------- noise helpers ----------
def pnoise(h, w, power, stretch=1.0, seed=None):
    """1/f noise that tiles; stretch > 1 makes features long and vertical."""
    r = np.random.default_rng(seed) if seed is not None else rng
    fy = np.fft.fftfreq(h)[:, None] * stretch
    fx = np.fft.fftfreq(w)[None, :]
    f = np.sqrt(fx ** 2 + fy ** 2)
    f[0, 0] = 1
    out = np.real(np.fft.ifft2(np.fft.fft2(r.standard_normal((h, w))) / f ** power))
    out -= out.min()
    return out / out.max()


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def to_img(arr, mode='RGB'):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode)


def gray(arr):
    return to_img(arr * 255, 'L')


# ---------- concrete ----------
def concrete(n=1024):
    big, mid, fine = pnoise(n, n, 2.0), pnoise(n, n, 1.2), rng.random((n, n))
    v = (big - .5) * 34 + (mid - .5) * 16 + (fine - .5) * 12
    col = np.array([122, 121, 114], float) + v[..., None] * np.array([1, 1, .95])
    mold = smooth(.66, .9, pnoise(n, n, 1.7)) ** 1.6
    col = col * (1 - mold[..., None] * .32) + np.array([62, 66, 58]) * mold[..., None] * .32
    col += smooth(.8, .95, pnoise(n, n, 1.5))[..., None] * 10
    col[rng.random((n, n)) > .994] *= .55
    img = to_img(col)
    d = ImageDraw.Draw(img)
    # formwork seams and tie holes: the tell-tale pattern of Japanese poured concrete
    for y in (0, n // 2):
        d.line([(0, y), (n, y)], fill=(84, 84, 80), width=2)
    for x in (0, n // 2):
        d.line([(x, 0), (x, n)], fill=(88, 88, 84), width=2)
    for gy in range(4):
        for gx in range(4):
            cx, cy = gx * n // 4 + n // 8, gy * n // 4 + n // 8
            d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=(98, 97, 92))
            d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=(52, 52, 50))
    img = img.filter(ImageFilter.GaussianBlur(.6))
    rough = .78 + (fine - .5) * .12 - mold * .2
    bump = mid * .6 + fine * .4
    return img, gray(rough), gray(bump)


def streaked_wall(n=1024):
    """concrete with long black rain streaks hanging from the top edge"""
    base, _, _ = concrete(n)
    col = np.asarray(base, float)
    streak = pnoise(n, n, 1.4, stretch=14)
    mask = smooth(.4, .75, streak)
    ys = np.linspace(0, 1, n)[:, None]
    length = .25 + pnoise(1, n, 1.2)[0][None, :] * .7
    fall = np.exp(-ys / length)
    dark = np.clip(mask * fall * 1.1 + smooth(.06, 0, ys) * .5, 0, .85)
    col = col * (1 - dark[..., None] * .62)
    col = col * (1 - dark[..., None] * .1) + np.array([40, 44, 38]) * dark[..., None] * .1
    rough = .8 - dark * .25
    return to_img(col), gray(rough)


# ---------- windows ----------
def windows(w=1024, h=1024):
    """4 rows (one per floor), each row = 4 bays of 3 sliding sashes; tiles horizontally"""
    rowh = h // 4
    albedo = Image.new('RGB', (w, h), (0, 0, 0))
    emis = Image.new('RGB', (w, h), (0, 0, 0))
    rough = Image.new('L', (w, h), 200)
    da, de, dr = ImageDraw.Draw(albedo), ImageDraw.Draw(emis), ImageDraw.Draw(rough)
    bay = w // 4
    for row in range(4):
        y0 = row * rowh
        for b in range(4):
            x0 = b * bay
            lit = rng.random() < .28
            # pillar
            da.rectangle([x0, y0, x0 + 26, y0 + rowh], fill=(104, 103, 97))
            da.rectangle([x0 + 22, y0, x0 + 26, y0 + rowh], fill=(80, 79, 75))
            wx0, wx1 = x0 + 26, x0 + bay
            sw = (wx1 - wx0) / 3
            for s in range(3):
                px0, px1 = int(wx0 + s * sw) + 5, int(wx0 + (s + 1) * sw) - 3
                py0, py1 = y0 + 8, y0 + rowh - 8
                kind = rng.choice(['glass', 'glass', 'curtain', 'broken', 'paper', 'board'], p=[.36, .1, .26, .1, .1, .08])
                if lit and kind in ('glass', 'curtain'):
                    kind = 'lit' if rng.random() < .8 else 'curtain'
                pane(albedo, emis, rough, kind, px0, py0, px1, py1)
                # aluminium sash frame
                da.rectangle([px0 - 5, py0 - 5, px1 + 3, py0], fill=(150, 152, 148))
                da.rectangle([px0 - 5, py1, px1 + 3, py1 + 5], fill=(128, 130, 126))
                da.rectangle([px0 - 5, py0, px0, py1], fill=(140, 142, 138))
                dr.rectangle([px0 - 5, py0 - 5, px1 + 3, py0], fill=130)
                dr.rectangle([px0 - 5, py1, px1 + 3, py1 + 5], fill=130)
                # transom bar
                ty = py0 + int((py1 - py0) * .28)
                da.rectangle([px0, ty, px1, ty + 4], fill=(136, 138, 134))
                de.rectangle([px0, ty, px1, ty + 4], fill=(0, 0, 0))
            da.rectangle([wx1 - 3, y0, wx1, y0 + rowh], fill=(120, 122, 118))
    # grime over everything
    g = pnoise(h, w, 1.6, stretch=4)
    a = np.asarray(albedo, float) * (1 - smooth(.5, .9, g)[..., None] * .35)
    return to_img(a), emis, rough


def pane(albedo, emis, rough, kind, x0, y0, x1, y1):
    w, h = x1 - x0, y1 - y0
    ys = np.linspace(0, 1, h)[:, None]
    xs = np.linspace(0, 1, w)[None, :]
    if kind == 'lit':
        # classroom inside: ceiling with fluorescent tubes, back wall, desk silhouettes
        col = np.zeros((h, w, 3)) + np.array([150, 158, 140]) * (1 - ys[..., None] * .55)
        for t in (.12, .3):
            col[int(h * t):int(h * t) + 3] = [236, 244, 226]
        col[int(h * .72):] *= .35
        for k in range(3):
            cx = int(w * (.2 + k * .3))
            col[int(h * .62):int(h * .72), max(0, cx - 8):cx + 8] *= .4
        e = col * .75
        glow = np.clip(e, 0, 255)
        emis.paste(to_img(glow), (x0, y0))
        col = col * .9 + np.array([30, 36, 34]) * .1
        ImageDraw.Draw(rough).rectangle([x0, y0, x1, y1], fill=40)
    elif kind == 'curtain':
        folds = (np.sin(xs * np.pi * rng.uniform(8, 14) + rng.uniform(0, 6)) * .5 + .5)
        cover = rng.uniform(.4, 1)
        base = np.array([170, 162, 140]) if rng.random() < .7 else np.array([120, 132, 124])
        col = base * (.72 + folds[..., None] * .28) * np.ones((h, 1, 1))
        gl = glass(h, w)
        m = (xs < cover).astype(float)[..., None] * np.ones((h, 1, 1))
        col = col * m + gl * (1 - m)
        col = col * .82 + np.array([60, 70, 68]) * .18
        ImageDraw.Draw(rough).rectangle([x0, y0, x1, y1], fill=70)
    elif kind == 'broken':
        col = glass(h, w)
        img = to_img(col)
        d = ImageDraw.Draw(img)
        cx, cy = rng.uniform(.3, .7) * w, rng.uniform(.3, .7) * h
        hole = [(cx + np.cos(a) * rng.uniform(6, 22), cy + np.sin(a) * rng.uniform(6, 22)) for a in np.linspace(0, 6.28, 9)]
        d.polygon(hole, fill=(14, 16, 16))
        for a in rng.uniform(0, 6.28, 9):
            ln = rng.uniform(.3, 1) * max(w, h)
            d.line([(cx, cy), (cx + np.cos(a) * ln, cy + np.sin(a) * ln)], fill=(190, 198, 196), width=1)
        col = np.asarray(img, float)
        ImageDraw.Draw(rough).rectangle([x0, y0, x1, y1], fill=35)
    elif kind == 'paper':
        col = glass(h, w)
        img = to_img(col)
        d = ImageDraw.Draw(img)
        px, py = rng.uniform(.05, .3) * w, rng.uniform(.3, .5) * h
        pw, ph = w * rng.uniform(.4, .6), h * rng.uniform(.3, .45)
        d.rectangle([px, py, px + pw, py + ph], fill=(196, 192, 176))
        for i in range(6):
            d.line([(px + 5, py + 8 + i * 7), (px + pw * rng.uniform(.5, .9), py + 8 + i * 7)], fill=(90, 88, 80), width=2)
        d.rectangle([px + pw * .4, py - 4, px + pw * .6, py + 3], fill=(200, 196, 150))
        col = np.asarray(img, float)
        ImageDraw.Draw(rough).rectangle([x0, y0, x1, y1], fill=45)
    elif kind == 'board':
        grain = pnoise(h, w, 1.3, stretch=.08, seed=int(rng.integers(1e6)))
        col = np.array([118, 94, 66]) * (.7 + grain[..., None] * .4)
        ImageDraw.Draw(rough).rectangle([x0, y0, x1, y1], fill=210)
    else:
        col = glass(h, w)
        ImageDraw.Draw(rough).rectangle([x0, y0, x1, y1], fill=25)
    albedo.paste(to_img(col), (x0, y0))


def glass(h, w):
    ys = np.linspace(0, 1, h)[:, None, None]
    xs = np.linspace(0, 1, w)[None, :, None]
    top, bot = np.array([96, 106, 104]), np.array([30, 36, 36])
    col = top * (1 - ys) + bot * ys + np.zeros((1, w, 1))
    streak = np.clip(1 - np.abs((xs - ys * .6) - rng.uniform(.1, .6)) * 9, 0, 1)
    return col + streak * 22


# ---------- ground: packed dirt schoolyard with puddles ----------
def ground(n=1024):
    big, mid, fine = pnoise(n, n, 2.1), pnoise(n, n, 1.1), rng.random((n, n))
    v = (big - .5) * 30 + (mid - .5) * 18 + (fine - .5) * 16
    col = np.array([86, 78, 64], float) + v[..., None] * np.array([1, .95, .85])
    peb = rng.random((n, n)) > .985
    col[peb] = col[peb] * .6 + np.array([150, 144, 132]) * .4
    # damp patches only; real puddles are separate meshes so they don't tile
    damp = smooth(.55, .8, pnoise(n, n, 2.4, seed=9))
    col = col * (1 - damp[..., None] * .3)
    col *= .82  # wet
    rough = np.clip(.72 + (fine - .5) * .2 - damp * .25, 0, 1)
    bump = mid * .5 + fine * .5
    return to_img(col), gray(rough), gray(bump)


# ---------- chain-link fence ----------
def fence(n=256, period=64, ss=4):
    N = n * ss
    img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    P = period * ss
    for k in range(-N // P - 2, 2 * N // P + 2):
        for dx in (-N, 0, N):
            d.line([(k * P + dx, 0), (k * P + dx + N, N)], fill=(160, 164, 160, 255), width=int(2.4 * ss))
            d.line([(k * P + dx, N), (k * P + dx + N, 0)], fill=(128, 132, 128, 255), width=int(2.4 * ss))
    return img.resize((n, n), Image.LANCZOS)


# ---------- rusty painted steel (water tank, poles) ----------
def metal(n=512):
    paint = np.array([74, 88, 86], float)
    col = paint + (pnoise(n, n, 1.4) - .5)[..., None] * 18
    rust = smooth(.62, .8, pnoise(n, n, 1.8))
    col = col * (1 - rust[..., None]) + np.array([104, 58, 34]) * rust[..., None]
    run = smooth(.5, .8, pnoise(n, n, 1.2, stretch=12)) * np.linspace(.2, 1, n)[:, None]
    col = col * (1 - run[..., None] * .5) + np.array([96, 54, 30]) * run[..., None] * .5
    return to_img(col), gray(.55 + rust * .35)


def shutter(n=512):
    ys = np.arange(n)[:, None]
    rib = (np.sin(ys / n * np.pi * 2 * 24) * .5 + .5)
    col = np.array([128, 132, 130], float) * (.62 + rib[..., None] * .38) + np.zeros((1, n, 1))
    rust = smooth(.66, .85, pnoise(n, n, 1.6)) + smooth(.5, .9, pnoise(n, n, 1.2, stretch=10)) * np.linspace(0, .6, n)[:, None]
    col = col * (1 - np.clip(rust, 0, 1)[..., None] * .6) + np.array([100, 60, 36]) * np.clip(rust, 0, 1)[..., None] * .6
    return to_img(col), gray(rib * .6 + .2)


# ---------- graffiti atlas (2048x1024, rects listed in GRAFFITI below) ----------
GRAFFITI = {
    'mbp': (0, 0, 1024, 512), 'bisma': (1024, 0, 1024, 256), 'stencil': (1024, 256, 1024, 256),
    'tags': (0, 512, 512, 512), 'bug': (512, 512, 512, 512), 'jumat': (1024, 512, 1024, 256),
    'tally': (1024, 768, 512, 256), 'prod': (1536, 768, 512, 256),
}


def spray(layer, color, soft=1.2, over=.3, drips=0, seed=0):
    """soften a hard-drawn RGBA layer into a spray-painted look"""
    r = np.random.default_rng(seed)
    a = np.asarray(layer.split()[-1], float) / 255
    halo = np.asarray(layer.split()[-1].filter(ImageFilter.GaussianBlur(7)), float) / 255
    alpha = np.maximum(np.asarray(layer.split()[-1].filter(ImageFilter.GaussianBlur(soft)), float) / 255, halo * over)
    rgb = np.asarray(layer.convert('RGB'), float)
    rgb = np.where(a[..., None] > .01, rgb, np.array(color, float))
    img = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
    if drips:
        d = ImageDraw.Draw(img)
        h, w = a.shape
        cols = np.where(a.sum(0) > 3)[0]
        for x in r.choice(cols, min(drips, len(cols)), replace=False):
            ys = np.where(a[:, x] > .5)[0]
            if not len(ys):
                continue
            y0 = ys.max()
            ln = r.uniform(10, 70)
            wd = r.uniform(2, 4.5)
            d.line([(x, y0), (x, y0 + ln)], fill=tuple(color) + (225,), width=int(wd))
            d.ellipse([x - wd * .7, y0 + ln - wd * .7, x + wd * .7, y0 + ln + wd * .7], fill=tuple(color) + (225,))
    # weathering: knock back random patches
    wt = pnoise(img.height, img.width, 1.6, seed=seed + 1)
    al = np.asarray(img.split()[-1], float) * (.55 + .45 * smooth(.2, .6, wt))
    al *= (np.random.default_rng(seed + 2).random(al.shape) > .04)
    img.putalpha(to_img(al, 'L'))
    return img


def text_layer(size, text, font, fill, stroke=0, stroke_fill=None, xy=None, anchor='mm'):
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    xy = xy or (size[0] / 2, size[1] / 2)
    d.text(xy, text, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill, anchor=anchor)
    return layer


def graffiti(fonts):
    dela = lambda s: ImageFont.truetype(str(fonts / 'ofl/delagothicone/DelaGothicOne-Regular.ttf'), s)
    mark = lambda s: ImageFont.truetype(str(fonts / 'apache/permanentmarker/PermanentMarker-Regular.ttf'), s)
    mono = lambda s: ImageFont.truetype(str(fonts / 'ofl/ibmplexmono/IBMPlexMono-Bold.ttf'), s)
    atlas = Image.new('RGBA', (2048, 1024), (0, 0, 0, 0))

    def put(key, img, rot=0):
        x, y, w, h = GRAFFITI[key]
        if rot:
            img = img.rotate(rot, resample=Image.BICUBIC, expand=False)
        atlas.alpha_composite(img.resize((w, h), Image.LANCZOS) if img.size != (w, h) else img, (x, y))

    # big throw-up: shadow, red outer line, black line, chrome fill
    size = (1024, 512)
    L = Image.new('RGBA', size, (0, 0, 0, 0))
    L.alpha_composite(spray(text_layer(size, 'MBP', dela(300), (12, 12, 12, 255), 34, (12, 12, 12, 255), (530, 270)), (12, 12, 12), seed=1))
    L.alpha_composite(spray(text_layer(size, 'MBP', dela(300), (176, 30, 36, 255), 28, (176, 30, 36, 255)), (176, 30, 36), drips=18, seed=2))
    chrome = text_layer(size, 'MBP', dela(300), (206, 206, 200, 255), 12, (16, 16, 16, 255))
    arr = np.asarray(chrome, float)
    ys = np.linspace(0, 1, size[1])[:, None]
    shade = np.where(ys < .5, 1.0, .72)[..., None]
    arr[..., :3] = np.where(arr[..., :3] > 60, arr[..., :3] * shade, arr[..., :3])
    L.alpha_composite(spray(Image.fromarray(arr.astype(np.uint8), 'RGBA'), (200, 200, 196), soft=.8, seed=3))
    put('mbp', L, -3)

    put('bisma', spray(text_layer((1024, 256), 'Bisma', mark(190), (190, 34, 40, 255)), (190, 34, 40), drips=14, seed=4), 2)

    # stencil with bridges cut through the letters
    st = text_layer((1024, 256), 'TEST DULU BARU PUSH', mono(92), (226, 224, 214, 255))
    d = ImageDraw.Draw(st)
    d.rectangle([0, 124, 1024, 131], fill=(0, 0, 0, 0))
    put('stencil', spray(st, (226, 224, 214), soft=1.6, over=.45, seed=5), -1)

    tg = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    r = np.random.default_rng(6)
    for word, col in [('3-5', (20, 20, 20)), ('S1', (210, 210, 205)), ('PUSH', (20, 20, 20)), ('404', (40, 40, 40)), ('NO BUG', (200, 200, 196)), ('ok', (20, 20, 20))]:
        t = text_layer((512, 512), word, mark(int(r.uniform(60, 110))), col + (255,), xy=(r.uniform(120, 390), r.uniform(80, 440)))
        t = t.rotate(r.uniform(-18, 12), resample=Image.BICUBIC)
        tg.alpha_composite(spray(t, col, drips=int(r.uniform(0, 5)), seed=int(r.integers(1000))))
    d = ImageDraw.Draw(tg)
    for _ in range(5):
        pts = [(r.uniform(20, 490), r.uniform(20, 490))]
        for _ in range(6):
            pts.append((pts[-1][0] + r.uniform(-60, 60), pts[-1][1] + r.uniform(-30, 30)))
        d.line(pts, fill=(18, 18, 18, 200), width=4, joint='curve')
    put('tags', tg)

    bug = spray(text_layer((512, 512), 'BUG', dela(190), (178, 32, 38, 255)), (178, 32, 38), drips=10, seed=7)
    x = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    d = ImageDraw.Draw(x)
    d.line([(60, 110), (460, 400)], fill=(14, 14, 14, 255), width=34)
    d.line([(460, 100), (70, 410)], fill=(14, 14, 14, 255), width=34)
    bug.alpha_composite(spray(x, (14, 14, 14), drips=6, seed=8))
    put('bug', bug, 4)

    put('jumat', spray(text_layer((1024, 256), 'jangan deploy hari jumat', mark(84), (228, 226, 216, 255)), (228, 226, 216), drips=8, seed=9), -2)

    ta = Image.new('RGBA', (512, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(ta)
    for g in range(4):
        ox = 40 + g * 110
        for i in range(4):
            d.line([(ox + i * 18, 60 + r.uniform(-4, 4)), (ox + i * 18 + r.uniform(-4, 4), 170)], fill=(222, 220, 210, 255), width=7)
        d.line([(ox - 12, 150), (ox + 70, 80)], fill=(222, 220, 210, 255), width=7)
    put('tally', spray(ta, (222, 220, 210), seed=10))

    pr = Image.new('RGBA', (512, 256), (0, 0, 0, 0))
    pr.alpha_composite(spray(text_layer((512, 256), 'PROD', dela(120), (14, 14, 14, 255), 16, (14, 14, 14, 255)), (14, 14, 14), seed=11))
    pr.alpha_composite(spray(text_layer((512, 256), 'PROD', dela(120), (214, 176, 50, 255)), (214, 176, 50), drips=8, seed=12))
    put('prod', pr, -4)
    return atlas


def save(img, path, q=84):
    img.save(path, 'WEBP', quality=q, method=6)
    print(f'{path.name:24s} {path.stat().st_size // 1024:5d} KB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fonts', required=True)
    ap.add_argument('--out', default='assets/textures')
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    c, cr, cb = concrete()
    save(c, out / 'concrete.webp'); save(cr, out / 'concrete_rough.webp', 70); save(cb, out / 'concrete_bump.webp', 70)
    s, sr = streaked_wall()
    save(s, out / 'wall.webp'); save(sr, out / 'wall_rough.webp', 70)
    w, we, wr = windows()
    save(w, out / 'windows.webp', 88); save(we, out / 'windows_emit.webp', 80); save(wr, out / 'windows_rough.webp', 70)
    g, gr, gb = ground()
    save(g, out / 'ground.webp'); save(gr, out / 'ground_rough.webp', 70); save(gb, out / 'ground_bump.webp', 70)
    save(fence(), out / 'fence.webp', 90)
    m, mr = metal()
    save(m, out / 'metal.webp'); save(mr, out / 'metal_rough.webp', 70)
    sh, sb = shutter()
    save(sh, out / 'shutter.webp'); save(sb, out / 'shutter_bump.webp', 70)
    save(graffiti(pathlib.Path(a.fonts)), out / 'graffiti.webp', 86)


if __name__ == '__main__':
    main()

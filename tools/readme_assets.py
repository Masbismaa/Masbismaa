"""Animated SVGs for the GitHub profile README (GitHub shows them as images, so CSS only).

    python tools/readme_assets.py

opening.svg uses the still frames in tools/stills (rendered from the 3D scene).
"""
import base64
import io
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'readme'
STILLS = ROOT / 'tools' / 'stills'
DISP = "'Barlow Condensed','Arial Narrow','Roboto Condensed','Helvetica Neue',Arial,sans-serif"
BODY = "'Barlow','Segoe UI','Helvetica Neue',Arial,sans-serif"
MONO = "'IBM Plex Mono',Consolas,'SFMono-Regular',Menlo,monospace"
BG, TEXT, DIM, FAINT, AMBER, RED = '#0b0c0b', '#e6e2d6', '#9da095', '#2a2b28', '#d6b04a', '#c9493c'


def still(name, w=1200, h=675, q=64):
    im = Image.open(STILLS / f'{name}.jpg').convert('RGB').resize((w, h), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()


def opening():
    w, h, bar, cyc = 1200, 520, 46, 13.5
    shots = [('hero', 'EXT. HALAMAN SEKOLAH, SORE, HUJAN', 'in'), ('roof', 'EXT. ATAP GEDUNG A, SORE', 'out'), ('aerial', 'EXT. SEKOLAH DARI UDARA, SORE', 'in')]
    n = len(shots)
    seg = 100 / n
    frames, slugs, css = [], [], []
    for i, (name, slug, move) in enumerate(shots):
        a, b = seg * i, seg * (i + 1)
        css.append(f"@keyframes cut{i} {{ 0%, {max(a - .01, 0):.2f}% {{ opacity: {1 if i == 0 else 0}; }} {a:.2f}%, {b - .01:.2f}% {{ opacity: 1; }} {b:.2f}%, 100% {{ opacity: 0; }} }}")
        s0, s1 = (1, 1.14) if move == 'in' else (1.16, 1.02)
        css.append(f"@keyframes kb{i} {{ 0%, {a:.2f}% {{ transform: scale({s0}); }} {b:.2f}%, 100% {{ transform: scale({s1}); }} }}")
        css.append(f".s{i} {{ opacity: 0; animation: cut{i} {cyc}s linear infinite; }} .k{i} {{ transform-box: view-box; transform-origin: 50% 55%; animation: kb{i} {cyc}s linear infinite; }}")
        frames.append(f'<g class="s{i}"><g class="k{i}"><image href="{still(name)}" x="0" y="{(h - 675) / 2:.0f}" width="1200" height="675" preserveAspectRatio="xMidYMid slice"/></g></g>')
        slugs.append(f'<text class="s{i}" x="48" y="{bar + 34}" font-family="{MONO}" font-size="13" letter-spacing="2.4" fill="{AMBER}"><tspan fill="{DIM}">0{i}  </tspan>{slug}</text>')
    drops = ''.join(f'<line x1="{(i * 97) % (w + 80)}" y1="{(i * 53) % h}" x2="{(i * 97) % (w + 80) - 5}" y2="{(i * 53) % h + 20}"/>' for i in range(90))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#060706" stop-opacity=".85"/><stop offset=".55" stop-color="#060706" stop-opacity=".25"/><stop offset="1" stop-color="#060706" stop-opacity="0"/></linearGradient>
    <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
    <clipPath id="frame"><rect width="{w}" height="{h}"/></clipPath>
  </defs>
  <style>
    {chr(10).join(css)}
    @keyframes rain {{ to {{ transform: translate(-40px, 260px); }} }}
    .rain {{ animation: rain .6s linear infinite; }}
    @keyframes blink {{ 50% {{ opacity: 0; }} }}
    .rec {{ animation: blink 1.2s steps(1) infinite; }}
    @keyframes rise {{ from {{ opacity: 0; transform: translateY(10px); }} to {{ opacity: 1; transform: none; }} }}
    .title {{ animation: rise 1s cubic-bezier(.2,.8,.2,1) .3s both; }}
    .sub {{ animation: rise 1s cubic-bezier(.2,.8,.2,1) .7s both; }}
  </style>
  <g clip-path="url(#frame)">
    <rect width="{w}" height="{h}" fill="{BG}"/>
    {''.join(frames)}
    <g class="rain" stroke="#dfe6ea" stroke-opacity=".22" stroke-width="1">{drops}<g transform="translate(0 -260)">{drops}</g></g>
    <rect width="{w}" height="{h}" fill="url(#vig)"/>
    <rect width="{w * .7:.0f}" height="{h}" fill="url(#fade)"/>
    {''.join(slugs)}
    <g class="title"><text x="46" y="{h - bar - 106}" font-family="{DISP}" font-weight="700" font-size="62" letter-spacing="-1" fill="{TEXT}" font-stretch="condensed">MOCHAMMAD BISMA</text>
    <text x="46" y="{h - bar - 54}" font-family="{DISP}" font-weight="700" font-size="62" letter-spacing="-1" fill="{TEXT}" font-stretch="condensed">PRASETYA</text></g>
    <text class="sub" x="48" y="{h - bar - 24}" font-family="{MONO}" font-size="14" letter-spacing="2" fill="{AMBER}">FULL STACK DEVELOPER  /  IT DEVELOPER DI SPINDO</text>
    <rect width="{w}" height="{bar}" fill="#000"/><rect y="{h - bar}" width="{w}" height="{bar}" fill="#000"/>
    <text x="48" y="29" font-family="{DISP}" font-weight="700" font-size="19" letter-spacing="2" fill="{TEXT}">MBP</text>
    <circle class="rec" cx="112" cy="23" r="4" fill="{RED}"/><text x="124" y="28" font-family="{MONO}" font-size="12" letter-spacing="2" fill="{DIM}">REC</text>
    <text x="{w - 48}" y="28" text-anchor="end" font-family="{MONO}" font-size="12" letter-spacing="2" fill="{DIM}">GEDUNG SEKOLAH  ·  HUJAN  ·  17:40</text>
  </g>
</svg>'''


def button():
    w, h = 1200, 96
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <style>
    @keyframes sweep {{ from {{ stroke-dashoffset: 2600; }} to {{ stroke-dashoffset: 0; }} }}
    .edge {{ stroke-dasharray: 260 2340; animation: sweep 4s linear infinite; }}
    @keyframes nudge {{ 0%, 100% {{ transform: none; }} 50% {{ transform: translateX(6px); }} }}
    .play {{ animation: nudge 1.4s ease-in-out infinite; }}
  </style>
  <rect x="1" y="1" width="{w - 2}" height="{h - 2}" fill="{BG}" stroke="{FAINT}" stroke-width="2"/>
  <rect class="edge" x="1" y="1" width="{w - 2}" height="{h - 2}" fill="none" stroke="{AMBER}" stroke-width="2"/>
  <text x="40" y="42" font-family="{MONO}" font-size="12" letter-spacing="2.4" fill="{DIM}">PORTFOLIO 3D INTERAKTIF</text>
  <text x="40" y="72" font-family="{DISP}" font-weight="700" font-size="30" letter-spacing="1" fill="{TEXT}" font-stretch="condensed">MASUK KE LOKASI SYUTING</text>
  <g class="play"><path d="M{w - 92} {h / 2 - 16} L{w - 64} {h / 2} L{w - 92} {h / 2 + 16} Z" fill="{AMBER}"/></g>
  <text x="{w - 118}" y="{h / 2 + 5}" text-anchor="end" font-family="{MONO}" font-size="12" letter-spacing="2" fill="{DIM}">masbismaa.github.io/Masbismaa</text>
</svg>'''


def alr():
    w, h = 1200, 400
    rows = [('Portal HRIS', 'WEB', 'MBP', 'Public', 'EDIT DAN HAPUS', TEXT), ('Core Switch L3', 'NETWORK', 'MBP', 'Private', 'EDIT DAN HAPUS', TEXT),
            ('SAP GUI Prod', 'APPLICATION', 'RNA', 'Public', 'LIHAT DAN SALIN', AMBER), ('Firewall Cabang', 'NETWORK', 'RNA', 'Private', None, RED),
            ('Panduan VPN', 'GENERAL', 'MBP', 'Public', 'EDIT DAN HAPUS', TEXT)]
    g = []
    for i, (t, c, o, v, acc, col) in enumerate(rows):
        y = 150 + i * 48
        g.append(f'<g class="row" style="animation-delay:{.2 + i * .1:.1f}s">'
                 f'<text x="48" y="{y + 28}" font-family="{BODY}" font-weight="600" font-size="17" fill="{TEXT}">{t}</text>'
                 f'<text x="360" y="{y + 28}" font-family="{MONO}" font-size="13" fill="{DIM}">{c}</text>'
                 f'<text x="560" y="{y + 28}" font-family="{MONO}" font-size="13" fill="{DIM}">{o}</text>'
                 f'<text x="680" y="{y + 28}" font-family="{MONO}" font-size="13" fill="{DIM}">{v}</text>'
                 + (f'<text x="860" y="{y + 28}" font-family="{MONO}" font-size="13" letter-spacing="1" fill="{col}">{acc}</text>' if acc else '')
                 + f'<rect x="40" y="{y + 47}" width="{w - 80}" height="1" fill="{FAINT}"/></g>')
        if acc is None:
            slats = ''.join(f'<rect x="40" y="{y + 3 + k * 7}" width="{w - 80}" height="2" fill="#4c4f52"/>' for k in range(6))
            g.append(f'<clipPath id="c{i}"><rect x="40" y="{y + 2}" width="{w - 80}" height="44"/></clipPath><g clip-path="url(#c{i})"><g class="door">'
                     f'<rect x="40" y="{y + 2}" width="{w - 80}" height="44" fill="#6c7073"/>{slats}<rect x="40" y="{y + 42}" width="{w - 80}" height="4" fill="#242628"/>'
                     f'<rect x="{w / 2 - 40}" y="{y + 14}" width="80" height="20" fill="{TEXT}" fill-opacity=".8"/><text x="{w / 2}" y="{y + 28}" text-anchor="middle" font-family="{MONO}" font-size="12" letter-spacing="3" fill="#1a1a1a">TUTUP</text></g></g>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <style>
    @keyframes in {{ from {{ opacity: 0; }} to {{ opacity: 1; }} }}
    .row {{ opacity: 0; animation: in .5s ease-out forwards; }}
    @keyframes door {{ 0%, 14% {{ transform: translateY(-48px); }} 24%, 80% {{ transform: none; }} 92%, 100% {{ transform: translateY(-48px); }} }}
    .door {{ animation: door 5s cubic-bezier(.55,0,.25,1.12) infinite; }}
  </style>
  <rect width="{w}" height="{h}" fill="{BG}"/>
  <text x="48" y="52" font-family="{MONO}" font-size="12.5" letter-spacing="2.4" fill="{AMBER}"><tspan fill="{DIM}">03  </tspan>EXT. GUDANG BELAKANG, SORE</text>
  <text x="46" y="104" font-family="{DISP}" font-weight="600" font-size="42" fill="{TEXT}" font-stretch="condensed">ALR: pintu mana yang boleh dibuka?</text>
  <text x="{w - 48}" y="104" text-anchor="end" font-family="{MONO}" font-size="12.5" letter-spacing="2" fill="{DIM}">ROLE: USER ENTRY MBP  ·  DATA CONTOH</text>
  <rect x="40" y="148" width="{w - 80}" height="1" fill="{FAINT}"/>
  {''.join(g)}
</svg>'''


def workflow():
    w, h, cyc = 1200, 250, 7.5
    steps = ['REQUIREMENT', 'SCHEMA', 'LOGIKA', 'TESTING', 'COMMIT']
    cw = (w - 80) / 5
    g = []
    for i, s in enumerate(steps):
        x = 40 + i * cw
        a = i * 100 / 6
        g.append(f'<style>@keyframes on{i} {{ 0%, {a:.1f}% {{ transform: scaleX(0); }} {a + 8:.1f}%, 92% {{ transform: scaleX(1); }} 100% {{ transform: scaleX(0); }} }} .u{i} {{ transform-box: fill-box; transform-origin: left; animation: on{i} {cyc}s cubic-bezier(.2,.8,.2,1) infinite; }}'
                 f'@keyframes lit{i} {{ 0%, {a:.1f}% {{ fill: {DIM}; }} {a + 4:.1f}%, 92% {{ fill: {TEXT}; }} 100% {{ fill: {DIM}; }} }} .t{i} {{ animation: lit{i} {cyc}s linear infinite; }}</style>'
                 f'<text class="t{i}" x="{x + 16}" y="150" font-family="{DISP}" font-weight="600" font-size="44" font-stretch="condensed">{i + 1}</text>'
                 f'<text class="t{i}" x="{x + 16}" y="180" font-family="{MONO}" font-size="12.5" letter-spacing="1.6">{s}</text>'
                 + (f'<rect x="{x + cw}" y="112" width="1" height="90" fill="{FAINT}"/>' if i < 4 else '')
                 + f'<rect class="u{i}" x="{x}" y="200" width="{cw}" height="2" fill="{AMBER}"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <rect width="{w}" height="{h}" fill="{BG}"/>
  <text x="48" y="52" font-family="{MONO}" font-size="12.5" letter-spacing="2.4" fill="{AMBER}"><tspan fill="{DIM}">07  </tspan>EXT. TANGGA KE ATAP, SORE</text>
  <text x="46" y="94" font-family="{DISP}" font-weight="600" font-size="34" fill="{TEXT}" font-stretch="condensed">Lima anak tangga, nggak boleh loncat</text>
  <rect x="40" y="112" width="{w - 80}" height="1" fill="{FAINT}"/><rect x="40" y="201" width="{w - 80}" height="1" fill="{FAINT}"/>
  {''.join(g)}
</svg>'''


def pytest():
    tests = ['test_login_email_korporat_valid', 'test_otp_kadaluarsa_ditolak', 'test_admin_tidak_lihat_data_private', 'test_user_entry_readonly_public_orang_lain', 'test_url_tanpa_http_ditolak', 'test_duplikasi_url_terdeteksi', 'test_audit_log_tidak_bisa_diubah']
    w, h, cyc = 1200, 380, 9
    lines = []
    for i, t in enumerate(tests):
        y, d = 112 + i * 28, .5 + i * .42
        lines.append(f'<g class="ln" style="animation-delay:{d:.2f}s"><rect x="48" y="{y - 13}" width="14" height="14" fill="{AMBER}"/>'
                     f'<path d="M51 {y - 6} l3.5 3.5 l6 -7" fill="none" stroke="#111" stroke-width="2"/>'
                     f'<text x="76" y="{y}" font-family="{MONO}" font-size="14.5" fill="{TEXT}">tests/test_alr.py::{t}</text>'
                     f'<text x="{w - 48}" y="{y}" text-anchor="end" font-family="{MONO}" font-size="13" letter-spacing="1.4" fill="{AMBER}">PASSED</text></g>')
    end = .5 + len(tests) * .42 + .2
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <style>
    @keyframes ln {{ 0% {{ opacity: 0; }} 2%, 94% {{ opacity: 1; }} 100% {{ opacity: 0; }} }}
    .ln {{ opacity: 0; animation: ln {cyc}s steps(1) infinite; }}
    @keyframes stamp {{ 0% {{ opacity: 0; transform: rotate(-6deg) scale(1.5); }} 3%, 92% {{ opacity: 1; transform: rotate(-6deg); }} 100% {{ opacity: 0; transform: rotate(-6deg); }} }}
    .stamp {{ transform-box: fill-box; transform-origin: center; opacity: 0; animation: stamp {cyc}s cubic-bezier(.2,1.4,.4,1) {end:.2f}s infinite; }}
    @keyframes blink {{ 50% {{ opacity: 0; }} }}
    .cur {{ animation: blink 1s steps(1) infinite; }}
  </style>
  <rect width="{w}" height="{h}" fill="#050605"/>
  <rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" fill="none" stroke="{FAINT}"/>
  <text x="48" y="44" font-family="{MONO}" font-size="12.5" letter-spacing="2.4" fill="{AMBER}"><tspan fill="{DIM}">08  </tspan>INT. KELAS 3-B, SORE</text>
  <text x="48" y="76" font-family="{MONO}" font-size="15" fill="{TEXT}"><tspan fill="{AMBER}">$</tspan> pytest -v</text>
  <rect class="cur" x="160" y="63" width="9" height="16" fill="{AMBER}"/>
  {''.join(lines)}
  <text class="ln" style="animation-delay:{end:.2f}s" x="48" y="{112 + len(tests) * 28 + 26}" font-family="{MONO}" font-size="15" fill="{AMBER}">7 passed in 0.84s</text>
  <g class="stamp"><rect x="{w - 290}" y="{h - 82}" width="236" height="50" fill="none" stroke="{RED}" stroke-width="2.5"/><text x="{w - 172}" y="{h - 48}" text-anchor="middle" font-family="{DISP}" font-weight="700" font-size="26" letter-spacing="2" fill="{RED}" font-stretch="condensed">LULUS SEMUA</text></g>
</svg>'''


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [('opening', opening), ('button', button), ('alr', alr), ('workflow', workflow), ('pytest', pytest)]:
        svg = fn()
        (OUT / f'{name}.svg').write_text(svg)
        print(f'{name}.svg {len(svg) // 1024} KB')


if __name__ == '__main__':
    main()

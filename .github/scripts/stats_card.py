"""Bikin kartu statistik GitHub bergaya film (stats.svg, langs.svg, film.svg).

Jalan di GitHub Actions, ambil data lewat GraphQL pakai GITHUB_TOKEN,
terus nulis SVG ke folder output. Tanpa library tambahan, cukup Python bawaan.
"""

import json
import os
import sys
import urllib.request
from datetime import date, timedelta

USERNAME = os.environ.get("GH_USER", "Masbismaa")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else "dist"

QUERY = """
query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name } }
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date } }
      }
    }
  }
}
"""


def fetch():
    # ambil data user dari GraphQL GitHub
    body = json.dumps({"query": QUERY, "variables": {"login": USERNAME}}).encode()
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=body,
        headers={"Authorization": f"bearer {TOKEN}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        data = json.load(res)
    if "errors" in data or not data.get("data", {}).get("user"):
        raise RuntimeError(json.dumps(data.get("errors", data))[:300])
    return data["data"]["user"]


def mock():
    # data palsu buat ngetes lokal tanpa internet
    days, start = [], date.today() - timedelta(days=364)
    for i in range(365):
        d = start + timedelta(days=i)
        days.append({"date": d.isoformat(), "contributionCount": (i * 7) % 5 if i % 9 else 0})
    weeks = [{"contributionDays": days[i:i + 7]} for i in range(0, 365, 7)]
    langs = [("Python", 52000), ("JavaScript", 21000), ("PHP", 12000), ("HTML", 9000), ("CSS", 6000), ("Dart", 3000)]
    return {
        "followers": {"totalCount": 12},
        "repositories": {"totalCount": 9, "nodes": [{"stargazerCount": 3, "languages": {"edges": [{"size": s, "node": {"name": n}} for n, s in langs]}}]},
        "contributionsCollection": {
            "totalCommitContributions": 214, "totalPullRequestContributions": 18, "totalIssueContributions": 7,
            "contributionCalendar": {"totalContributions": 312, "weeks": weeks},
        },
    }


def streaks(weeks):
    # hitung streak sekarang & terpanjang dari kalender kontribusi
    days = [d for w in weeks for d in w["contributionDays"]]
    days.sort(key=lambda d: d["date"])
    longest = run = 0
    for d in days:
        run = run + 1 if d["contributionCount"] > 0 else 0
        longest = max(longest, run)
    current = 0
    for i, d in enumerate(reversed(days)):
        if d["contributionCount"] > 0:
            current += 1
        elif i == 0:
            continue  # hari ini belum commit, streak belum putus
        else:
            break
    return current, longest



BG = "#0b0c0b"
TEXT = "#e6e2d6"
DIM = "#9da095"
FAINT = "#2a2b28"
AMBER = "#d6b04a"
RED = "#c9493c"
DISP = "'Barlow Condensed','Arial Narrow','Roboto Condensed','Helvetica Neue',Arial,sans-serif"
MONO = "'IBM Plex Mono',Consolas,'SFMono-Regular',Menlo,monospace"
BARS = ["#e6e2d6", "#d6b04a", "#9da095", "#c9493c", "#6f7d7a", "#5b5d58"]

STYLE = """
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    .f { opacity: 0; animation: fade .6s ease-out forwards; }
    .g { transform-box: fill-box; transform-origin: left; animation: grow .9s cubic-bezier(.2,.8,.2,1) both; }
"""


def card(w, h, slug, title):
    return f"""<rect width="{w}" height="{h}" fill="{BG}"/>
  <rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" fill="none" stroke="{FAINT}"/>
  <text x="28" y="36" font-family="{MONO}" font-size="11" letter-spacing="2" fill="{AMBER}">{slug}</text>
  <text x="27" y="68" font-family="{DISP}" font-weight="600" font-size="26" fill="{TEXT}">{title}</text>
  <rect x="28" y="82" width="{w - 56}" height="1" fill="{FAINT}"/>"""


def esc(text):
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def stats_svg(u):
    cc = u["contributionsCollection"]
    cur, longest = streaks(cc["contributionCalendar"]["weeks"])
    stars = sum(r["stargazerCount"] for r in u["repositories"]["nodes"])
    items = [
        ("kontribusi", cc["contributionCalendar"]["totalContributions"]),
        ("commit", cc["totalCommitContributions"]),
        ("pull request", cc["totalPullRequestContributions"]),
        ("issue", cc["totalIssueContributions"]),
        ("repository", u["repositories"]["totalCount"]),
        ("bintang", stars),
    ]
    w, h = 440, 230
    cells = []
    for i, (label, value) in enumerate(items):
        x, y = 28 + (i % 3) * 132, 128 + (i // 3) * 60
        cells.append(
            f'<g class="f" style="animation-delay:{0.1 + i * 0.08:.2f}s">'
            f'<text x="{x}" y="{y}" font-family="{DISP}" font-weight="600" font-size="32" fill="{TEXT}">{esc(value)}</text>'
            f'<text x="{x}" y="{y + 18}" font-family="{MONO}" font-size="10.5" letter-spacing="1.4" fill="{DIM}">{esc(label).upper()}</text></g>'
        )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <style>{STYLE}</style>
  {card(w, h, "CATATAN SYUTING", "Aktivitas setahun")}
  <text x="{w - 28}" y="36" text-anchor="end" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="{DIM}">STREAK <tspan fill="{AMBER}">{cur}</tspan> HARI · TERPANJANG {longest}</text>
  {"".join(cells)}
</svg>
"""


def langs_svg(u):
    totals = {}
    for repo in u["repositories"]["nodes"]:
        for edge in repo["languages"]["edges"]:
            totals[edge["node"]["name"]] = totals.get(edge["node"]["name"], 0) + edge["size"]
    top = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)[:6]
    grand = sum(totals.values()) or 1
    w, h = 440, 230
    rows = []
    if not top:
        rows.append(f'<text x="28" y="130" font-family="{MONO}" font-size="13" fill="{DIM}">belum ada kode publik</text>')
    for i, (name, size) in enumerate(top):
        pct = size / grand * 100
        y = 104 + i * 20
        bar_w = max(4, 220 * size / top[0][1])
        rows.append(
            f'<g class="f" style="animation-delay:{0.1 + i * 0.08:.2f}s">'
            f'<text x="28" y="{y + 10}" font-family="{MONO}" font-size="12" fill="{TEXT}">{esc(name)}</text>'
            f'<rect class="g" style="animation-delay:{0.25 + i * 0.08:.2f}s" x="132" y="{y + 2}" width="{bar_w:.1f}" height="8" fill="{BARS[i % len(BARS)]}"/>'
            f'<text x="{140 + bar_w:.1f}" y="{y + 10}" font-family="{MONO}" font-size="11" fill="{DIM}">{pct:.1f}%</text></g>'
        )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <style>{STYLE}</style>
  {card(w, h, "BAHASA", "Paling sering dipakai")}
  {"".join(rows)}
</svg>
"""


def film_svg(u):
    # grafik kontribusi setahun sebagai pita film; playhead menyapu dan kotaknya menyala satu per satu
    weeks = u["contributionsCollection"]["contributionCalendar"]["weeks"][-53:]
    total = u["contributionsCollection"]["contributionCalendar"]["totalContributions"]
    cell, gap, left, top = 12, 3, 40, 104
    cols = len(weeks)
    w = left * 2 + cols * (cell + gap)
    strip_top, strip_h = top - 26, 7 * (cell + gap) + 40
    h = strip_top + strip_h + 46
    cycle, sweep = 10, 7.0
    levels = ["#3b3a2c", "#6e6231", "#a88f3c", "#d6b04a"]
    counts = [d["contributionCount"] for wk in weeks for d in wk["contributionDays"]]
    peak = max(counts) if counts else 0

    def level(c):
        if c <= 0 or peak == 0:
            return None
        return levels[min(3, int((c / peak) * 4 - 1e-9))]

    empty, filled = [], []
    for ci, wk in enumerate(weeks):
        x = left + ci * (cell + gap)
        delay = ci / max(1, cols - 1) * sweep
        for day in wk["contributionDays"]:
            ri = date.fromisoformat(day["date"]).isoweekday() % 7
            y = top + ri * (cell + gap)
            empty.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="#161715"/>')
            color = level(day["contributionCount"])
            if color:
                filled.append(f'<rect class="c" style="animation-delay:{delay:.2f}s" x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{color}"/>')

    holes = "".join(
        f'<rect x="{x}" y="{strip_top + 6}" width="8" height="6" fill="{BG}"/><rect x="{x}" y="{strip_top + strip_h - 12}" width="8" height="6" fill="{BG}"/>'
        for x in range(left - 20, w - left + 20, 16)
    )
    x_end = left + cols * (cell + gap)
    style = f"""
    @keyframes pop {{ 0% {{ opacity: 0; }} 3%, 90% {{ opacity: 1; }} 100% {{ opacity: 0; }} }}
    .c {{ opacity: 0; animation: pop {cycle}s steps(1) infinite; }}
    @keyframes head {{ 0% {{ transform: translateX(0); opacity: 1; }} {sweep / cycle * 100:.0f}% {{ transform: translateX({x_end - left}px); opacity: 1; }} {sweep / cycle * 100 + 4:.0f}%, 100% {{ transform: translateX({x_end - left}px); opacity: 0; }} }}
    .head {{ animation: head {cycle}s linear infinite; }}
    @keyframes holes {{ to {{ transform: translateX(-16px); }} }}
    .holes {{ animation: holes .5s linear infinite; }}
    @keyframes fade {{ from {{ opacity: 0; }} to {{ opacity: 1; }} }}
    .f {{ animation: fade .8s ease-out both; }}
"""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <style>{style}</style>
  <rect width="{w}" height="{h}" fill="{BG}"/>
  <rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" fill="none" stroke="{FAINT}"/>
  <text x="{left}" y="36" font-family="{MONO}" font-size="11" letter-spacing="2" fill="{AMBER}" class="f">ROL FILM KONTRIBUSI</text>
  <text x="{left}" y="62" font-family="{DISP}" font-weight="600" font-size="24" fill="{TEXT}" class="f">{total} kontribusi setahun</text>
  <rect x="{left - 24}" y="{strip_top}" width="{w - 2 * left + 48}" height="{strip_h}" fill="#050605"/>
  <clipPath id="strip"><rect x="{left - 24}" y="{strip_top}" width="{w - 2 * left + 48}" height="{strip_h}"/></clipPath>
  <g clip-path="url(#strip)"><g class="holes">{holes}</g></g>
  {"".join(empty)}
  {"".join(filled)}
  <g class="head"><rect x="{left - 2}" y="{strip_top + 14}" width="2" height="{strip_h - 28}" fill="{RED}"/><path d="M{left - 7} {strip_top + 14} h12 l-6 7 z" fill="{RED}"/></g>
  <g font-family="{MONO}" font-size="11" fill="{DIM}">
    <text x="{left}" y="{h - 18}">SEDIKIT</text>
    {"".join(f'<rect x="{left + 62 + i * 16}" y="{h - 28}" width="11" height="11" fill="{c}"/>' for i, c in enumerate(levels))}
    <text x="{left + 62 + 4 * 16 + 6}" y="{h - 18}">BANYAK</text>
  </g>
</svg>
"""


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    user = mock() if os.environ.get("MOCK") else fetch()
    for name, fn in (("stats.svg", stats_svg), ("langs.svg", langs_svg), ("film.svg", film_svg)):
        with open(os.path.join(OUT_DIR, name), "w", encoding="utf-8") as f:
            f.write(fn(user))
    print("kartu statistik selesai dibuat di", OUT_DIR)


if __name__ == "__main__":
    main()

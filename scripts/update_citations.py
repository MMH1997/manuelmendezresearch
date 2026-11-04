#!/usr/bin/env python3
"""Refresh data/citations.json with the public metrics of a Google Scholar profile.

Used by .github/workflows/update-citations.yml (daily). Standard library only.

1. Reads the public Scholar profile page directly.
2. If Google blocks the request (common for cloud IPs) and a SERPAPI_KEY
   environment variable is set, falls back to the SerpApi Scholar Author API.
3. Exits with an error if neither works, so a stale widget is never silent.

Usage:
    python3 scripts/update_citations.py              # fetch and write
    python3 scripts/update_citations.py --from-file page.html   # parse a saved page (testing)
"""
import datetime
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

SCHOLAR_USER = "avZSGS0AAAAJ"
PROFILE_URL = f"https://scholar.google.com/citations?user={SCHOLAR_USER}&hl=en"
OUT = Path(__file__).resolve().parent.parent / "data" / "citations.json"
UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0 Safari/537.36"
)


def http_get(url, headers=None):
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def sane_by_year(by_year, total):
    """Per-year counts can never add up to more than the total."""
    if not by_year:
        return []
    if sum(item["citations"] for item in by_year) > total:
        return []
    return by_year


def parse_scholar(page):
    cells = re.findall(r'<td class="gsc_rsb_std">\s*(\d+)\s*</td>', page)
    if len(cells) < 6:
        raise ValueError("Scholar stats table not found (blocked or captcha?)")
    citations, recent, h_index, _, i10_index, _ = (int(c) for c in cells[:6])
    since = re.search(r'<th class="gsc_rsb_sth">\s*Since\s+(\d{4})', page)

    labels = re.findall(
        r'<span class="gsc_g_t"\s+style="(?:left|right):\s*(-?\d+)px">\s*(\d{4})\s*</span>', page
    )
    bars = re.findall(
        r'class="gsc_g_a"\s+style="[^"]*?(?:left|right):\s*(-?\d+)px[^"]*">\s*<span class="gsc_g_al">\s*(\d+)\s*</span>',
        page,
    )
    by_year = []
    if labels and bars and len(labels) == len(bars):
        by_year = [
            {"year": int(year), "citations": int(count)}
            for (_, year), (_, count) in zip(
                sorted(labels, key=lambda x: int(x[0])), sorted(bars, key=lambda x: int(x[0]))
            )
        ]
        by_year.sort(key=lambda item: item["year"])
        # Positions run in one direction only; make sure years are consecutive.
        years = [item["year"] for item in by_year]
        if years != list(range(years[0], years[0] + len(years))):
            by_year = []

    return {
        "citations": citations,
        "citationsRecent": recent,
        "recentSince": int(since.group(1)) if since else None,
        "hIndex": h_index,
        "i10Index": i10_index,
        "byYear": sane_by_year(by_year, citations),
    }


def fetch_scholar():
    page = http_get(PROFILE_URL + "&pagesize=20", {"User-Agent": UA, "Accept-Language": "en"})
    return parse_scholar(page)


def fetch_serpapi(key):
    query = urllib.parse.urlencode(
        {"engine": "google_scholar_author", "author_id": SCHOLAR_USER, "hl": "en", "api_key": key}
    )
    data = json.loads(http_get("https://serpapi.com/search.json?" + query))
    cited = data["cited_by"]
    stats = {}
    recent_since = None
    for row in cited["table"]:
        (name, values), = row.items()
        stats[name] = values["all"]
        for field, value in values.items():
            if field.startswith("since_"):
                recent_since = int(field.split("_")[1])
                stats[name + "_recent"] = value
    by_year = sorted(
        ({"year": int(g["year"]), "citations": int(g["citations"])} for g in cited.get("graph", [])),
        key=lambda item: item["year"],
    )
    return {
        "citations": stats["citations"],
        "citationsRecent": stats.get("citations_recent"),
        "recentSince": recent_since,
        "hIndex": stats["h_index"],
        "i10Index": stats["i10_index"],
        "byYear": sane_by_year(by_year, stats["citations"]),
    }


def main():
    if "--from-file" in sys.argv:
        path = sys.argv[sys.argv.index("--from-file") + 1]
        metrics = parse_scholar(Path(path).read_text(encoding="utf-8"))
        print(json.dumps(metrics, indent=2))
        return 0

    metrics = None
    errors = []
    try:
        metrics = fetch_scholar()
        source = "Google Scholar"
    except Exception as exc:  # network error, HTTP 429/403, captcha page, layout change
        errors.append(f"Direct Scholar request failed: {exc}")

    if metrics is None and os.environ.get("SERPAPI_KEY"):
        try:
            metrics = fetch_serpapi(os.environ["SERPAPI_KEY"])
            source = "Google Scholar (via SerpApi)"
        except Exception as exc:
            errors.append(f"SerpApi request failed: {exc}")

    if metrics is None:
        for line in errors:
            print("::error::" + line)
        if not os.environ.get("SERPAPI_KEY"):
            print("::notice::Set a SERPAPI_KEY repository secret to enable the fallback.")
        return 1

    payload = {
        "source": source,
        "profile": f"https://scholar.google.com/citations?user={SCHOLAR_USER}",
        "checked": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d"),
        **metrics,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}: {payload['citations']} citations, h-index {payload['hIndex']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

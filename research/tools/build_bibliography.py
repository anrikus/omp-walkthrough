#!/usr/bin/env python3
"""Regenerate the four research bibliography artifacts using only the stdlib."""
from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
GRADES = "ABCDE"
GRADE_NAMES = {
    "A": "Peer-reviewed", "B": "Preprint / technical report",
    "C": "First-party", "D": "Secondary", "E": "Anecdotal",
}
CITATION = re.compile(r"\[(\d+(?:\s*[-–—]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–—]\s*\d+)?)*)((?:,\s*[^\]]*)?)\]")
URL = re.compile(r"[a-z][a-z0-9+.-]*://[^\s<>\"“”`]+", re.I)
ARXIV = re.compile(
    r"(?:arxiv(?:\.org/(?:abs|html|pdf)/|\s*:?\s*(?:identifier is\s+)?\**))"
    r"(?P<id>\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(?P<version>v\d+)?",
    re.I,
)
DOI = re.compile(r"\b10\.\d{4,9}/[^\s<>\"“”`]+", re.I)

# Keep pre-split keys on their original documents when new clusters share a key base.
RETAINED_KEYS = {
    "https://raw.githubusercontent.com/badlogic/pi-mono/v0.50.0/README.md": "picontributors2026pi",
    "https://docs.openclaw.ai/concepts/agent": "openclawcontributors2026agent",
    "https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/prompts/agents/reviewer.md": "ohmypimaintainers2026bundled",
    "https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/prompts/agents/security-reviewer.md": "ohmypimaintainers2026bundled-2",
    "https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/overlays/model-hub.ts": "stencillabs2026model-3",
    "https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/config/model-registry.ts": "stencillabs2026model-4",
}


def unique(values):
    return list(dict.fromkeys(values))


def citations(text):
    # Code indices such as `metrics[0]` are not bibliographic citations.
    text = re.sub(r"(`+)[\s\S]*?\1", "", text)
    numbers = []
    for match in CITATION.finditer(text):
        for part in match.group(1).split(","):
            bounds = re.split(r"\s*[-–—]\s*", part.strip())
            if len(bounds) == 2:
                start, end = map(int, bounds)
                if end < start:
                    raise ValueError(f"Descending citation range: {match.group()}")
                numbers.extend(str(n) for n in range(start, end + 1))
            else:
                numbers.append(str(int(bounds[0])))
    return unique(numbers)


def clean(value):
    value = re.sub(r"(?<!\w)(\*{1,2}|_{1,2})(.+?)\1(?!\w)", r"\2", value)
    return re.sub(r"\s+", " ", value.replace("`", "")).strip()


def trim_link(value):
    value = value.rstrip(".,;:!?”’\"]}")
    while value.endswith(")") and value.count(")") > value.count("("):
        value = value[:-1]
    return value


def normalize_url(value):
    parts = urlsplit(trim_link(value))
    host = parts.netloc.lower().removeprefix("www.") if parts.scheme in ("http", "https") else parts.netloc
    scheme = "https" if parts.scheme in ("http", "https") else parts.scheme
    query = urlencode(sorted(
        (key, val) for key, val in parse_qsl(parts.query, keep_blank_values=True)
        if not key.lower().startswith("utm_")
    ))
    return urlunsplit((scheme, host, parts.path.rstrip("/"), query, ""))


def display_urls(values):
    """Deduplicate equivalent web spellings without discarding query/fragment locators."""
    result, seen = [], set()
    for value in values:
        parts = urlsplit(value)
        key = value
        if parts.scheme in ("http", "https"):
            host = parts.netloc.lower()
            default_port = ":443" if parts.scheme == "https" else ":80"
            host = host.removesuffix(default_port)
            key = urlunsplit((parts.scheme, host, parts.path or "/", parts.query, parts.fragment))
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


def section(text, heading):
    match = re.search(r"^## " + re.escape(heading) + r"\s*$", text, re.M)
    if not match:
        raise ValueError(f"Missing section: {heading}")
    end = re.search(r"^## ", text[match.end():], re.M)
    return text[match.end():match.end() + end.start()] if end else text[match.end():]


def source_type(title, venue, urls, arxiv, dois):
    text = (title + " " + (venue or "")).lower()
    hosts = [urlsplit(url).netloc for url in urls]
    if arxiv or dois or re.search(r"\b(neurips|iclr|icml|tacl|eacl|colm|proceedings|paper|technical report|survey, landscape)\b", text):
        return "paper"
    if any("reddit.com" in host or "news.ycombinator.com" in host for host in hosts) or any("github.com/" in url and "/discussions/" in url for url in urls):
        return "forum"
    if "leaderboard" in text:
        return "leaderboard"
    if "dataset" in text or any("huggingface.co" in host and "/datasets/" in url for host, url in zip(hosts, urls)):
        return "dataset"
    if any(url.startswith(("omp://", "xd://", "cfg://")) for url in urls) or re.search(r"\b(documentation|docs|reference|bundled)\b", text):
        return "docs"
    if any(host in ("github.com", "raw.githubusercontent.com", "gist.github.com") for host in hosts):
        return "repo"
    if re.search(r"\b(news|reporting|reuters|techcrunch|the verge)\b", text):
        return "news"
    if "blog" in text or any("/blog/" in url or "/posts/" in url or "/engineering/" in url or "blog." in url for url in urls):
        return "blog"
    return "other"


def parse_reference(dossier, number, raw):
    text = re.sub(r"^\[\d+\]\s*", "", raw).strip()
    urls = unique(trim_link(match.group()) for match in URL.finditer(text))
    quote = re.search(r'“([^”]+)”|"([^"\n]+)"', text)
    first_url = URL.search(text)
    if quote and (first_url is None or quote.start() < first_url.start()):
        title = clean(quote.group(1) or quote.group(2)).rstrip(".,;:")
        authors = clean(text[:quote.start()]).rstrip(". ")
        tail = text[quote.end():]
    else:
        prefix = re.split(r"[a-z][a-z0-9+.-]*://|Grade\s*:", text, maxsplit=1)[0]
        parts = re.split(r"\.\s+", clean(prefix), maxsplit=1)
        authors, title = (parts[0], parts[1].rstrip(" .;,:")) if len(parts) == 2 else ("", clean(prefix).rstrip(" .;,:"))
        tail = ""
    metadata = re.split(r"[a-z][a-z0-9+.-]*://|Grade\s*:", tail, maxsplit=1)[0]
    metadata = clean(metadata).strip(" .;,")
    # Qualifiers between a closing title and its publisher are not the venue.
    metadata = re.sub(r"^\([^)]*\)\.?\s*", "", metadata)
    metadata = re.sub(r"^,?\s*§[^.]*\.\s*", "", metadata)
    year_match = re.search(r"(?<!\d)(?:19|20)\d{2}(?!\d)", metadata)
    undated = re.search(r"\bn\.d\.?|undated|date not displayed|publication date not", metadata, re.I)
    year = int(year_match.group()) if year_match and not undated else None
    venue = metadata[:year_match.start()] if year_match else metadata
    venue = re.sub(r"[,;.]?\s*(?:n\.d\.?|live|current|snapshot|historical|earlier|latest)\s*$", "", venue, flags=re.I)
    venue = re.sub(r"\b(?:Canonical|Open manuscript|Venue record|accepted paper|published paper|Latest manuscript|Earlier arXiv|arXiv)\s*:?\s*$", "", venue, flags=re.I)
    venue = re.sub(r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{0,2}[ ,]*$", "", venue, flags=re.I)
    venue = re.sub(r"\b(?:last-updated|updated|displayed(?: date)?|published|run|cutoff)\s*$", "", venue.rstrip(" ,;"), flags=re.I)
    venue = venue.strip(" ,;.:—-") or None
    grade_match = re.search(r"\bGrade\s*:\s*\**([A-E])\b", text, re.I)
    grade = grade_match.group(1).upper() if grade_match else None
    grade_annotation = re.search(r"\bGrade\s*:\s*(.*?)(?=\bAccessed|$)", text, re.I | re.S)
    grade_text = grade_annotation.group(1).strip() if grade_annotation else None
    additional_grades = re.findall(r"[,;]\s*\**([A-E])\b(?:\**\s+(?:only\s+)?for\b|-level\b)", grade_text or "")
    additional_grades += re.findall(r"\b(?:grade|statement)\s+\**([A-E])\b", grade_text or "")
    grades = unique(([grade] if grade else []) + additional_grades)
    access = re.search(r"\bAccessed\s*:?\s*(\d{4}-\d{2}-\d{2})", text, re.I)
    dois = unique(trim_link(match.group()).lower() for match in DOI.finditer(text))
    arxiv = {}
    for match in ARXIV.finditer(text):
        identifier = match.group("id").lower()
        versions = arxiv.setdefault(identifier, [])
        if match.group("version"):
            versions.append(match.group("version").lower())
        else:
            # Unsuffixed URLs sometimes record their resolved version in parentheses.
            following = text[match.end():]
            resolved = re.match(r"\s*\([^)]{0,100}?\b(v\d+)\b", following, re.I)
            if resolved:
                versions.append(resolved.group(1).lower())
    arxiv = {identifier: sorted(set(versions), key=lambda v: int(v[1:])) for identifier, versions in arxiv.items()}
    return {
        "dossier": dossier, "n": str(number), "raw_text": raw,
        "title": title, "authors": authors, "venue": venue, "year": year,
        "grade": grade, "grades": grades, "grade_text": grade_text,
        "type": source_type(title, venue, urls, arxiv, dois),
        "urls": urls, "dois": dois, "arxiv": arxiv,
        "accessed": access.group(1) if access else None,
    }


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", text.lower())


def key_base(record):
    omp = next((url for url in record["urls"] if url.startswith("omp://")), None)
    if omp:
        path = normalize_url(omp).removeprefix("omp://").removesuffix(".md")
        return "ompdocs-" + re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-")
    author = re.split(r",|;| / |\bet al\.?", record["authors"])[0].strip()
    author = re.sub(r"\([^)]*\)", "", author).strip()
    organization = re.search(
        r"\b(team|maintainers|labs|research|ai|github|openai|anthropic|langchain|"
        r"google|deepseek|microsoft|stack overflow|aider|stencil|codex|nous|"
        r"swe-bench|terminal-bench|openreview|jetbrains|hugging face|sierra|"
        r"developers|foundation|project|community|contributors|staff)\b", author, re.I,
    )
    author = slug(author if organization else (author.split()[-1] if author else "unknown"))
    words = re.findall(r"[\w]+(?:[-–][\w]+)*", record["title"], re.UNICODE)
    ignored = {"a", "an", "the", "how", "what", "why", "we", "i", "on", "of", "for", "in", "to"}
    word = next((slug(word) for word in words if word.lower() not in ignored and not word.isdigit()), "source")
    return f"{author}{record['year'] or 'nd'}{word}"


def consolidate(records, grade_resolutions):
    parents = list(range(len(records)))

    def root(index):
        while parents[index] != index:
            parents[index] = parents[parents[index]]
            index = parents[index]
        return index

    identities = {}
    for index, record in enumerate(records):
        tokens = [("doi", value) for value in record["dois"]]
        tokens += [("arxiv", value) for value in record["arxiv"]]
        if record["urls"]:
            tokens.append(("url", normalize_url(record["urls"][0])))
        # A documented URL alias may match only the same full document title.
        tokens += [("title-url", slug(record["title"]), normalize_url(url)) for url in record["urls"]]
        for token in tokens:
            if token in identities:
                left, right = root(index), root(identities[token])
                parents[max(left, right)] = min(left, right)
            else:
                identities[token] = index
    groups = defaultdict(list)
    for index, record in enumerate(records):
        groups[root(index)].append(record)
    sources, citation_map, used_keys = [], {record["dossier"]: {} for record in records}, set()
    reserved_keys = set(RETAINED_KEYS.values())
    for members in groups.values():
        first = members[0]
        retained_key = next((RETAINED_KEYS[normalize_url(member["urls"][0])] for member in members if member["urls"] and normalize_url(member["urls"][0]) in RETAINED_KEYS), None)
        base = key_base(first)
        key, suffix = retained_key or base, 2
        while key in used_keys or (key in reserved_keys and key != retained_key):
            key = f"{base}-{suffix}"
            suffix += 1
        used_keys.add(key)
        conflicts = []
        fields = ("title", "authors", "venue", "year", "grade", "accessed")
        for field in fields:
            if field == "grade":
                values = unique(grade for member in members for grade in member["grades"])
            else:
                values = unique(member[field] for member in members if member[field] is not None or field == "year")
            if len(values) > 1:
                conflicts.append({
                    "field": field, "values": values,
                    "observations": [
                        {"dossier": member["dossier"], "n": member["n"], "value": member["grades"] if field == "grade" else member[field]}
                        for member in members
                    ],
                })
        arxiv = defaultdict(set)
        for member in members:
            for identifier, versions in member["arxiv"].items():
                arxiv[identifier].update(versions)
        for identifier, versions in arxiv.items():
            if len(versions) > 1:
                conflicts.append({
                    "field": "arxiv.version", "id": identifier,
                    "values": sorted(versions, key=lambda v: int(v[1:])),
                    "observations": [
                        {"dossier": member["dossier"], "n": member["n"], "value": member["arxiv"][identifier]}
                        for member in members if identifier in member["arxiv"]
                    ],
                })
        dois = unique(doi for member in members for doi in member["dois"])
        for field, values in (("doi", dois), ("arxiv.id", list(arxiv))):
            if len(values) > 1:
                conflicts.append({"field": field, "values": values})
        grades = unique(grade for member in members for grade in member["grades"])
        source = {"key": key}
        for field in ("title", "authors", "venue", "year"):
            source[field] = next((member[field] for member in members if member[field] is not None), None)
        source.update({
            "grade": grades[0] if len(grades) == 1 else None,
            "type": first["type"],
            "urls": display_urls(url for member in members for url in member["urls"]),
            "doi": dois[0] if dois else None,
            "arxiv": {"id": next(iter(arxiv)), "versions": sorted(arxiv[next(iter(arxiv))], key=lambda v: int(v[1:]))} if arxiv else None,
            "accessed": next((member["accessed"] for member in members if member["accessed"]), None),
            "cited_by": [{"dossier": member["dossier"], "n": member["n"]} for member in members],
            "conflicts": conflicts,
            "source_records": members,
        })
        if key in grade_resolutions:
            resolution = grade_resolutions[key]
            source["grade"] = resolution["grade"]
            source["gradeNote"] = resolution["note"]
        sources.append(source)
        for member in members:
            citation_map[member["dossier"]][member["n"]] = key
    return sources, citation_map


def takeaways(text):
    current = None
    for line in section(text, "Narration-ready takeaways").splitlines():
        bullet = re.match(r"^\s*[-*+]\s+(.*)$", line)
        if bullet:
            if current is not None:
                yield current.rstrip("\n")
            current = bullet.group(1)
        elif current is not None:
            if line.strip() and not line.startswith((" ", "\t")):
                yield current.rstrip("\n")
                current = None
            else:
                current += "\n" + line
    if current is not None:
        yield current.rstrip("\n")


def table_cells(line):
    return [cell.strip() for cell in re.split(r"(?<!\\)\|", line.strip().strip("|"))]


def number_rows(text):
    lines = section(text, "Key numbers").splitlines()
    headers = None
    previous = {}
    for index, line in enumerate(lines):
        if not line.strip().startswith("|"):
            headers = None
            previous = {}
            continue
        cells = table_cells(line)
        if all(re.fullmatch(r":?-{3,}:?", cell.replace(" ", "")) for cell in cells):
            continue
        if index + 1 < len(lines) and lines[index + 1].strip().startswith("|"):
            next_cells = table_cells(lines[index + 1])
            if all(re.fullmatch(r":?-{3,}:?", cell.replace(" ", "")) for cell in next_cells):
                headers = cells
                previous = {}
                if len(set(headers)) != len(headers):
                    raise ValueError("Duplicate Key numbers table headers")
                continue
        if headers is None or len(headers) != len(cells):
            raise ValueError(f"Malformed Key numbers table row: {line}")
        row = dict(zip(headers, cells))
        resolved = {}
        for column, value in row.items():
            if value.casefold() == "same":
                if column in previous:
                    resolved[column] = f"{value} ({previous[column]})"
            else:
                previous[column] = value
        yield row, resolved


def build_claims(dossiers, records, citation_map):
    local = {(record["dossier"], record["n"]): record for record in records}
    claims = []
    for dossier, text in dossiers.items():
        for kind, prefix, values in (("takeaway", "T", ((value, {}) for value in takeaways(text))), ("number", "N", number_rows(text))):
            for index, (value, resolved) in enumerate(values, 1):
                prose = value if isinstance(value, str) else " ".join(value.values())
                numbers = citations(prose)
                missing = [n for n in numbers if n not in citation_map[dossier]]
                keys = unique(citation_map[dossier][n] for n in numbers if n in citation_map[dossier])
                grades = sorted({grade for n in numbers if (dossier, n) in local for grade in local[dossier, n]["grades"]})
                flags = []
                if re.search(r"\banecdot\w*", prose, re.I) or (grades and all(grade in "DE" for grade in grades)):
                    flags.append("anecdotal")
                if not numbers:
                    flags.append("uncited")
                if missing:
                    flags.append("unresolved-citation")
                if any(local[dossier, n]["grade"] is None for n in numbers if (dossier, n) in local):
                    flags.append("ungraded-source")
                if any(len(local[dossier, n]["grades"]) > 1 for n in numbers if (dossier, n) in local):
                    flags.append("scope-dependent-grade")
                claims.append({
                    "id": f"C{dossier}-{prefix}{index}", "dossier": dossier,
                    "kind": kind, "text": value, "citations": keys,
                    "grades": grades, "min_grade": grades[0] if grades else None,
                    "flags": flags,
                })
                if resolved:
                    claims[-1]["resolved"] = resolved
    return claims


def anomalies(dossiers, records, sources):
    report = {"missing_references": [], "uncited_references": [], "missing_urls": [], "missing_grades": []}
    for dossier, text in dossiers.items():
        # Exclude only the reference-entry labels, not citations in other sections.
        without_labels = re.sub(r"^\[\d+\](?=\s)", "", text, flags=re.M)
        used = set(citations(without_labels))
        present = {record["n"] for record in records if record["dossier"] == dossier}
        report["missing_references"] += [f"{dossier} [{n}]" for n in sorted(used - present, key=int)]
        report["uncited_references"] += [f"{dossier} [{n}]" for n in sorted(present - used, key=int)]
    for record in records:
        label = f"{record['dossier']} [{record['n']}]"
        if not record["urls"]:
            report["missing_urls"].append(label)
        if not record["grade"]:
            report["missing_grades"].append(label)
    report["conflicts"] = [(source["key"], conflict) for source in sources for conflict in source["conflicts"]]
    return report


def markdown(sources, records, claims, report):
    counts = Counter(source["grade"] or "Conflicting / missing" for source in sources)
    lines = [
        "# Consolidated research bibliography", "",
        "Generated by `python3 research/tools/build_bibliography.py`. Do not edit generated outputs; edit the dossiers and regenerate.", "",
        "## Method and data contract", "",
        "The inputs are every positive-numbered `NN-*.md` dossier (excluding `00` synthesis), in filename order, then local reference-number order. "
        "Identity merges are transitive on DOI, arXiv ID (ignoring version), or an identical normalized primary (first) URL. "
        "Secondary URLs can identify aliases only when both records have the same full normalized title; they cannot bridge differently titled documents. "
        "URL identity uses HTTPS, drops `www.`, trailing slashes, fragments and `utm_*` parameters, and sorts query parameters. "
        "Source `urls` retain original spellings, deduplicating equivalent web root-slash, host-case and default-port variants. "
        "Distinct query/fragment locators and non-web addresses are retained; all raw grouped evidence remains in `source_records`.", "",
        "A mid-write dossier with missing sections, malformed rows, duplicate labels or unreadable text is explicitly listed as incomplete and skipped for this snapshot, with an empty citation-map entry. "
        "A structurally readable dossier with unresolved citations remains included and receives anomaly/claim flags. Regenerate after editing finishes; these warnings do not stop other dossiers from building.", "",
        "Keys derive from the earliest record in each cluster; collisions receive `-2`, `-3`, etc. "
        "The generator reserves six pre-split keys for their original primary documents so splitting earlier clusters cannot silently repurpose those citations. "
        "Other keys are deterministic for unchanged inputs, not guaranteed unchanged after an earlier reference is added or identifying metadata is edited. "
        "Bundled documentation uses `ompdocs-<path>`. An unstated publication year is `null` (`nd` in keys); access dates are not publication years.", "",
        "Metadata is extracted from the supplied citations without fetching sources. "
        "The earliest non-null title, author string, venue, year and access date are display values, not adjudicated truth. "
        "All observed disagreements and scope-dependent grade declarations are recorded in `conflicts`. "
        "Explicit editorial decisions in `research/grade-resolutions.json` set the displayed grade and `gradeNote`; otherwise multi-grade sources retain grade `null`. "
        "Raw dossier grades and conflicts are never overwritten by a resolution. "
        "Venue conflicts include wording differences, not only incompatible publication venues. "
        "`source_records` preserves every raw reference and its individually extracted metadata, DOI list, and arXiv versions. "
        "For grouped references containing different DOI/arXiv IDs, the first ID is displayed and all IDs are retained in source records and conflicts.", "",
        "Citation extraction accepts adjacent references, numeric lists/ranges and locators such as `[13, §5.3.4]`. "
        "Backticked code is excluded: dossier 05's `metrics[0].mean` contains an array index, not an unresolved reference. "
        "Internal `omp://`, `xd://` and `cfg://` addresses count as URLs without requiring web access.", "",
        "Claim text preserves Markdown and citations; table text is an object containing every column (cell-edge whitespace is trimmed). "
        "For number rows, `resolved` optionally supplies display text for a cell equal to `Same`, using the nearest preceding non-`Same` value in that column of the same table; the original `text` cell remains unchanged. "
        "Claim grades come from the cited dossier-local records, so a merged source's disputed grade cannot erase the originating evidence grade. "
        "`min_grade` means the best cited grade, not a confidence score. `anecdotal` flags explicit anecdotal language or exclusively D/E support; negations are not interpreted. "
        "`scope-dependent-grade` identifies claims citing entries with several qualified grades; raw `grade_text` retains those qualifications. "
        "Source `type` is a deterministic URL/title/venue heuristic, not a new evidence grade.", "",
        "## Statistics", "",
        f"- Dossiers included: {len({record['dossier'] for record in records})}; incomplete snapshots skipped: {len(report['incomplete_dossiers'])}",
        f"- Local reference entries: {len(records)}",
        f"- Global reference clusters: {len(sources)}",
        f"- Duplicate entries merged: {len(records) - len(sources)}",
        f"- Claims: {len(claims)} ({sum(c['kind'] == 'takeaway' for c in claims)} takeaways; {sum(c['kind'] == 'number' for c in claims)} key-number rows)",
        "", "| Grade | Global sources |", "|---|---:|",
    ]
    lines += [f"| {grade} — {GRADE_NAMES[grade]} | {counts[grade]} |" for grade in GRADES]
    lines += [f"| Conflicting / missing grade | {counts['Conflicting / missing']} |", "", "## Anomalies", ""]
    for key, title in (
        ("missing_references", "Body/table citations missing from References"),
        ("uncited_references", "References never cited in their dossier"),
        ("missing_urls", "Reference entries lacking a URL"),
        ("missing_grades", "Reference entries lacking a grade"),
        ("incomplete_dossiers", "Incomplete dossier snapshots skipped"),
    ):
        values = report[key]
        lines.append(f"- **{title}: {len(values)}.** " + ("; ".join(values) if values else "None."))
    cross = []
    for item in report["conflicts"]:
        observations = [observation for observation in item[1].get("observations", []) if observation["value"]]
        if item[1]["field"] in ("grade", "venue", "arxiv.version") and any(
            left["dossier"] != right["dossier"] and left["value"] != right["value"]
            for left in observations for right in observations
        ):
            cross.append(item)
    lines += [f"- **Cross-dossier grade/venue/version conflict fields: {len(cross)}** across {len({key for key, _ in cross})} global sources.",
              f"- **All metadata conflict fields: {len(report['conflicts'])}** across {sum(bool(s['conflicts']) for s in sources)} global sources (includes titles, authors, years, access dates and within-dossier versions).", ""]
    lines += ["### Cross-dossier grade, venue and version conflicts", ""]
    if not cross:
        lines.append("None.")
    for key, conflict in cross:
        lines.append(f"- `{key}` — **{conflict['field']}**: " + "; ".join(f"`{json.dumps(value, ensure_ascii=False)}`" for value in conflict["values"]))
    lines += ["", "## Sources by grade", ""]
    for grade in [*GRADES, None]:
        lines += [f"### {grade} — {GRADE_NAMES[grade]}" if grade else "### Conflicting / missing grade", ""]
        grouped = [source for source in sources if source["grade"] == grade]
        if not grouped:
            lines += ["None.", ""]
        for source in grouped:
            lines += [f"#### {source['key']}", "", f"**{source['title']}**", "",
                      f"- Authors / organization: {source['authors'] or 'Not stated'}",
                      f"- Venue / publisher: {source['venue'] or 'Not stated'}",
                      f"- Year: {source['year'] or 'Not stated'}; type: {source['type']}; accessed: {source['accessed'] or 'Not stated'}",
                      "- Cited by: " + ", ".join(f"{ref['dossier']} [{ref['n']}]" for ref in source["cited_by"])]
            if "gradeNote" in source:
                lines.append(f"- Grade resolution: **{source['grade']}** — {source['gradeNote']}")
            if source["doi"]:
                lines.append(f"- DOI: `{source['doi']}`")
            if source["arxiv"]:
                lines.append(f"- arXiv: `{source['arxiv']['id']}`; recorded versions: {', '.join(source['arxiv']['versions']) or 'not specified'}")
            lines += [f"- URL: <{url}>" for url in source["urls"]]
            for conflict in source["conflicts"]:
                lines.append(f"- Conflict — **{conflict['field']}**: " + "; ".join(f"`{json.dumps(value, ensure_ascii=False)}`" for value in conflict["values"]))
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main():
    grade_resolutions = json.loads((ROOT / "grade-resolutions.json").read_text(encoding="utf-8"))
    for key, resolution in grade_resolutions.items():
        if resolution.get("grade") not in set(GRADES) or not resolution.get("note"):
            raise ValueError(f"Invalid grade resolution: {key}")
    files = sorted(path for path in ROOT.glob("[0-9][0-9]-*.md") if int(path.name[:2]) >= 1)
    inputs = [(path.name[:2], path.name, path) for path in files]
    dossier_counts = Counter(dossier for dossier, _, _ in inputs)
    dossiers, records, incomplete = {}, [], []
    for dossier, name, path in inputs:
        try:
            if dossier_counts[dossier] > 1:
                raise ValueError("duplicate dossier number")
            text = path.read_text(encoding="utf-8")
            citations(text)
            references = section(text, "References")
            matches = list(re.finditer(r"^\[(\d+)\]\s+", references, re.M))
            if not matches:
                raise ValueError("no reference entries")
            numbers = [match.group(1) for match in matches]
            if len(set(numbers)) != len(numbers):
                raise ValueError("duplicate local reference labels")
            if not list(takeaways(text)) or not list(number_rows(text)):
                raise ValueError("no takeaway bullets or key-number rows")
            parsed = []
            for index, match in enumerate(matches):
                end = matches[index + 1].start() if index + 1 < len(matches) else len(references)
                parsed.append(parse_reference(dossier, match.group(1), references[match.start():end].strip()))
        except (OSError, ValueError) as error:
            incomplete.append(f"{name}: {error}")
            continue
        dossiers[dossier] = text
        records.extend(sorted(parsed, key=lambda record: int(record["n"])))
    sources, citation_map = consolidate(records, grade_resolutions)
    citation_map = {dossier: citation_map.get(dossier, {}) for dossier, _, _ in inputs}
    claims = build_claims(dossiers, records, citation_map)
    report = anomalies(dossiers, records, sources)
    report["incomplete_dossiers"] = incomplete
    outputs = {"bibliography.json": sources, "citation-map.json": citation_map, "claims.json": claims}
    for name, value in outputs.items():
        (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "bibliography.md").write_text(markdown(sources, records, claims, report), encoding="utf-8")
    counts = Counter(source["grade"] or "conflicting/missing" for source in sources)
    print(f"{len(records)} references -> {len(sources)} sources; {len(records) - len(sources)} duplicates merged; {len(claims)} claims")
    print("Grades: " + ", ".join(f"{grade}={counts[grade]}" for grade in [*GRADES, "conflicting/missing"]))
    print("Anomalies: " + ", ".join(f"{key}={len(value)}" for key, value in report.items()))
    for warning in incomplete:
        print(f"Incomplete dossier: {warning}")
    if report["missing_references"]:
        print("Unresolved dossier citations: " + ", ".join(report["missing_references"]))


if __name__ == "__main__":
    main()

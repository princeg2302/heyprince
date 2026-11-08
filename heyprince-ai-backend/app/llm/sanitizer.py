import re

NO_EM_DASH_INSTRUCTION = (
    "STRICT EDITORIAL RULE: Never use em dashes (—) or en dashes (–) anywhere in your output. "
    "Use commas, colons, semicolons, parentheses, or simple hyphens (-) instead."
)

def sanitize_em_dashes(text: str) -> str:
    """
    Replaces Unicode em dashes (—, \u2014) and en dashes (–, \u2013)
    from AI-generated outputs while preserving code blocks and formatting.
    """
    if not text:
        return text

    # Split on fenced code blocks (``` ... ```)
    parts = re.split(r"(```[\s\S]*?```)", text)

    for i in range(0, len(parts), 2):
        chunk = parts[i]
        if "—" not in chunk and "–" not in chunk:
            continue

        # 1. Prefix list markers at line start: "^— item" -> "- item"
        chunk = re.sub(r"(^|\n)\s*[—–]\s*", r"\1- ", chunk)

        # 2. Number / Year ranges: "2024—2026" -> "2024-2026"
        chunk = re.sub(r"(\d+)\s*[—–]\s*(\d+)", r"\1-\2", chunk)

        # 3. Attribution after quotes: '"Quote" — Author' -> '"Quote" - Author'
        chunk = re.sub(r"([\"'\.\!\?])\s*[—–]\s*([A-Z])", r"\1 - \2", chunk)

        # 4. Title / Subtitle patterns: "Title — Subtitle" -> "Title: Subtitle"
        chunk = re.sub(r"^((?:#{1,6}\s+)?[A-Z0-9][^:.\n—–]*?\s+[^:.\n—–]{2,60})\s*[—–]\s*([A-Z0-9])", r"\1: \2", chunk, flags=re.MULTILINE)

        # 5. Explanatory continuation: "simple — speed matters" -> "simple: speed matters"
        chunk = re.sub(r"\b(namely|specifically|simple|clear|obvious|key|result|truth|fact|rule|note|takeaway)\s*[—–]\s*", r"\1: ", chunk, flags=re.IGNORECASE)

        # 6. General clause break: replace remaining em dashes with comma or hyphen
        chunk = re.sub(r"\s*[—–]\s*", ", ", chunk)

        # Clean double commas
        chunk = re.sub(r",\s*,", ", ", chunk)

        parts[i] = chunk

    return "".join(parts)


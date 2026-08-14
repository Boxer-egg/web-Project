#!/usr/bin/env python3
"""
Parse the downloaded gameData.js into a structured JSON for the BALL x PIT synthesis tool.

This script avoids eval() on untrusted input. It uses brace-counting to extract the
GAME_DATA object literal and a small tokenizer to turn it into Python data.
"""

import json
import re
from pathlib import Path


def load_js_file(path: str) -> str:
    """Read the JS source file, ensuring it exists."""
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"game data file not found: {path}")
    return file_path.read_text(encoding="utf-8")


def strip_comments(source: str) -> str:
    """Remove // and /* */ comments from JS source so parsing is easier."""
    result = []
    i = 0
    length = len(source)
    while i < length:
        # Block comment
        if source[i] == "/" and i + 1 < length and source[i + 1] == "*":
            i += 2
            while i < length and not (source[i] == "*" and i + 1 < length and source[i + 1] == "/"):
                i += 1
            i += 2
            continue
        # Line comment
        if source[i] == "/" and i + 1 < length and source[i + 1] == "/":
            while i < length and source[i] != "\n":
                i += 1
            continue
        result.append(source[i])
        i += 1
    return "".join(result)


def extract_object_literal(source: str, start_marker: str, end_char: str) -> str:
    """Extract a {...} or [...] block starting right after start_marker."""
    start = source.find(start_marker)
    if start == -1:
        raise ValueError(f"marker not found: {start_marker}")
    # Move past the marker to the opening brace/bracket
    open_idx = source.find("{", start) if end_char == "}" else source.find("[", start)
    if open_idx == -1:
        raise ValueError(f"block start not found for marker: {start_marker}")

    depth = 0
    in_string = False
    escape = False
    for i in range(open_idx, len(source)):
        ch = source[i]
        if in_string:
            if escape:
                escape = False
                continue
            if ch == "\\":
                escape = True
                continue
            if ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
            continue
        if ch in {"{", "["}:
            depth += 1
        elif ch in {"}", "]"}:
            depth -= 1
            if depth == 0:
                return source[open_idx : i + 1]
    raise ValueError(f"unclosed block for marker: {start_marker}")


def tokenize(text: str) -> list:
    """Tokenize a JS object/array literal into strings, numbers, identifiers, and structural chars."""
    tokens = []
    i = 0
    length = len(text)
    while i < length:
        ch = text[i]
        if ch.isspace():
            i += 1
            continue

        if ch == '"':
            # String literal; preserve escaped quotes/backslashes for json.loads.
            chars = ['"']
            i += 1
            while i < length:
                c = text[i]
                if c == "\\":
                    chars.append(c)
                    i += 1
                    if i < length:
                        chars.append(text[i])
                        i += 1
                    continue
                if c == '"':
                    chars.append(c)
                    i += 1
                    break
                chars.append(c)
                i += 1
            tokens.append("".join(chars))
            continue

        if ch.isdigit() or (ch == "-" and i + 1 < length and text[i + 1].isdigit()):
            chars = [ch]
            i += 1
            while i < length and (text[i].isdigit() or text[i] == "."):
                chars.append(text[i])
                i += 1
            tokens.append("".join(chars))
            continue

        if ch.isalpha() or ch == "_":
            chars = [ch]
            i += 1
            while i < length and (text[i].isalnum() or text[i] == "_"):
                chars.append(text[i])
                i += 1
            # Allow constant references like DAMAGE_TYPE.FIRE
            while i < length and text[i] == "." and i + 1 < length and (text[i + 1].isalpha() or text[i + 1] == "_"):
                chars.append(text[i])
                i += 1
                while i < length and (text[i].isalnum() or text[i] == "_"):
                    chars.append(text[i])
                    i += 1
            tokens.append("".join(chars))
            continue

        tokens.append(ch)
        i += 1
    return tokens


def parse_tokens(tokens: list, idx: int = 0):
    """Parse a value starting at tokens[idx]; return (value, next_idx)."""
    if idx >= len(tokens):
        raise ValueError("unexpected end of tokens")

    tok = tokens[idx]

    if tok.startswith('"'):
        return json.loads(tok), idx + 1

    if tok == "true":
        return True, idx + 1
    if tok == "false":
        return False, idx + 1
    if tok == "null":
        return None, idx + 1

    if tok.replace(".", "", 1).lstrip("-").isdigit():
        return (float(tok) if "." in tok else int(tok)), idx + 1

    if re.match(r"^[A-Z_][A-Z_0-9]*\.[A-Z_][A-Z_0-9]*$", tok):
        # Constant reference like DAMAGE_TYPE.FIRE; keep as string.
        return tok, idx + 1

    if tok == "[":
        arr = []
        idx += 1
        while idx < len(tokens) and tokens[idx] != "]":
            val, idx = parse_tokens(tokens, idx)
            arr.append(val)
            if idx < len(tokens) and tokens[idx] == ",":
                idx += 1
        if idx >= len(tokens) or tokens[idx] != "]":
            raise ValueError("unterminated array")
        return arr, idx + 1

    if tok == "{":
        obj = {}
        idx += 1
        while idx < len(tokens) and tokens[idx] != "}":
            # Object keys may be quoted strings or unquoted identifiers.
            key_tok = tokens[idx]
            if key_tok.startswith('"'):
                key = json.loads(key_tok)
            elif re.match(r"^[a-zA-Z_$][a-zA-Z0-9_$]*$", key_tok):
                key = key_tok
            else:
                raise ValueError(f"expected object key string or identifier, got {key_tok}")
            idx += 1
            if idx >= len(tokens) or tokens[idx] != ":":
                raise ValueError(f"expected ':' after object key {key}")
            idx += 1
            val, idx = parse_tokens(tokens, idx)
            obj[key] = val
            if idx < len(tokens) and tokens[idx] == ",":
                idx += 1
        if idx >= len(tokens) or tokens[idx] != "}":
            raise ValueError("unterminated object")
        return obj, idx + 1

    raise ValueError(f"unexpected token: {tok}")


def main() -> None:
    """Parse gameData.js and write normalized JSON output."""
    root = Path(__file__).resolve().parent
    source_path = root / "gameData.js"
    output_path = root / "gameData.json"

    source = load_js_file(str(source_path))
    cleaned = strip_comments(source)

    game_data_text = extract_object_literal(cleaned, "const GAME_DATA = {", "}")
    tokens = tokenize(game_data_text)
    game_data, next_idx = parse_tokens(tokens, 0)

    if next_idx != len(tokens):
        raise ValueError(f"trailing tokens after GAME_DATA: {tokens[next_idx:]}")

    # Only keep the arrays we care about.
    wanted_keys = {"baseBalls", "evolutions", "advancedEvolutions", "baseItems", "passiveEvolutions"}
    output = {k: v for k, v in game_data.items() if k in wanted_keys}

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Wrote {output_path}")
    for key in wanted_keys:
        count = len(output.get(key, []))
        print(f"  {key}: {count}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Normalize BALL x PIT game data for the frontend synthesis tool.

Outputs a single JSON with:
- balls: list of all balls (base + evolved + advanced) keyed by id
- recipes: list of recipes producing each ball
- parent/child relationships for click-to-expand tree
"""

import json
from pathlib import Path
from collections import defaultdict


def load_json(path: str):
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"data file not found: {path}")
    return json.loads(file_path.read_text(encoding="utf-8"))


def ensure_ball(balls, name, name_cn=None, img=None, tier=0, released=False):
    """Create or update a ball entry by English name."""
    if name not in balls:
        balls[name] = {
            "id": name,
            "name": name,
            "nameCn": name_cn or name,
            "img": img or "",
            "tier": tier,
            "released": released,
            "parents": [],
            "children": [],
            "recipes": [],
            "tags": [],
            "damageTypes": [],
            "statusEffects": [],
            "effect": "",
            "effectCn": "",
        }
    return balls[name]


def normalize():
    root = Path(__file__).resolve().parent
    raw = load_json(str(root / "gameData.json"))

    # Naturalist update (game version 1.301, Aug 2026) made Flesh and several
    # related balls/evolutions available. Patch the imported data accordingly.
    NATURALIST_PATCHES = {
        "Flesh": True,
        "Petrify": True,
        "Offspring": True,
        "Flesh Mound": True,
        "Zombie": True,
        "Tumor": True,
        "Elemental": True,
    }
    for b in raw.get("baseBalls", []):
        if b["name"] in NATURALIST_PATCHES:
            b["released"] = NATURALIST_PATCHES[b["name"]]
    for e in raw.get("evolutions", []):
        if e["name"] in NATURALIST_PATCHES:
            e["released"] = NATURALIST_PATCHES[e["name"]]
    for e in raw.get("advancedEvolutions", []):
        if e["name"] in NATURALIST_PATCHES:
            e["released"] = NATURALIST_PATCHES[e["name"]]

    balls = {}

    # Tier 0: base balls
    for b in raw.get("baseBalls", []):
        name = b["name"]
        ball = ensure_ball(balls, name, b.get("nameCn"), b.get("img"), tier=0, released=b.get("released", False))
        ball["effect"] = b.get("effect", "")
        ball["effectCn"] = b.get("effectCn", "")
        ball["tags"] = [str(t) for t in b.get("tags", [])]
        ball["damageTypes"] = [str(dt) for dt in b.get("damageType", [])] if isinstance(b.get("damageType"), list) else ([str(b["damageType"])] if b.get("damageType") else [])
        ball["statusEffects"] = [str(se) for se in b.get("statusEffects", [])]

    # Tier 1: basic evolutions (row + col are base ball IDs like "BLEED")
    evolution_groups = defaultdict(list)
    for e in raw.get("evolutions", []):
        # Skip unreleased entries unless they belong to the Naturalist update (Flesh family).
        if not e.get("released", False):
            continue
        evolution_groups[e["name"]].append(e)

    for result_name, entries in evolution_groups.items():
        first = entries[0]
        ball = ensure_ball(balls, result_name, first.get("nameCn"), first.get("img"), tier=1, released=True)
        ball["effect"] = first.get("effect", "")
        ball["effectCn"] = first.get("effectCn", "")
        ball["tags"] = [str(t) for t in first.get("tags", [])]
        ball["damageTypes"] = [str(dt) for dt in first.get("damageTypes", [])]
        ball["statusEffects"] = [str(se) for se in first.get("statusEffects", [])]

        for entry in entries:
            row = entry["row"]
            col = entry["col"]
            row_ball = next((b for b in raw["baseBalls"] if b["id"] == row), None)
            col_ball = next((b for b in raw["baseBalls"] if b["id"] == col), None)
            if not row_ball or not col_ball:
                continue
            left_name = row_ball["name"]
            right_name = col_ball["name"]
            recipe = {
                "result": result_name,
                "components": [left_name, right_name],
                "tier": 1,
            }
            ball["recipes"].append(recipe)
            ball["parents"].append(left_name)
            ball["parents"].append(right_name)
            ensure_ball(balls, left_name)
            ensure_ball(balls, right_name)
            if result_name not in balls[left_name]["children"]:
                balls[left_name]["children"].append(result_name)
            if result_name not in balls[right_name]["children"]:
                balls[right_name]["children"].append(result_name)

    # Tier 2: advanced evolutions
    for e in raw.get("advancedEvolutions", []):
        if not e.get("released", False):
            continue
        name = e["name"]
        ball = ensure_ball(balls, name, e.get("nameCn"), e.get("img"), tier=2, released=True)
        ball["effect"] = e.get("effect", "")
        ball["effectCn"] = e.get("effectCn", "")
        ball["tags"] = [str(t) for t in e.get("tags", [])]
        ball["damageTypes"] = [str(dt) for dt in e.get("damageTypes", [])]
        ball["statusEffects"] = [str(se) for se in e.get("statusEffects", [])]

        components = e.get("components", [])
        recipe = {
            "result": name,
            "components": components,
            "tier": 2,
        }
        ball["recipes"].append(recipe)
        for comp in components:
            ball["parents"].append(comp)
            ensure_ball(balls, comp)
            if name not in balls[comp]["children"]:
                balls[comp]["children"].append(name)

    # Deduplicate parents/children/recipes
    for ball in balls.values():
        ball["parents"] = list(dict.fromkeys(ball["parents"]))
        ball["children"] = list(dict.fromkeys(ball["children"]))
        # Deduplicate recipes by component tuple
        seen = set()
        unique = []
        for r in ball["recipes"]:
            key = tuple(sorted(r["components"]))
            if key not in seen:
                seen.add(key)
                unique.append(r)
        ball["recipes"] = unique

    # Compute true tiers topologically. Base balls are tier 0. An evolved ball's tier
    # is 1 + max tier of any component in its recipes. Iterate until stable.
    changed = True
    max_iterations = 20
    iteration = 0
    while changed and iteration < max_iterations:
        changed = False
        iteration += 1
        for ball in balls.values():
            if ball["tier"] == 0:
                continue
            max_parent_tier = 0
            for recipe in ball["recipes"]:
                for comp in recipe["components"]:
                    parent = balls.get(comp)
                    if parent:
                        max_parent_tier = max(max_parent_tier, parent["tier"])
            new_tier = max_parent_tier + 1
            if new_tier > ball["tier"]:
                ball["tier"] = new_tier
                changed = True

    output = {
        "version": "1.301",
        "source": "https://ballxpit-query-tool.pages.dev/",
        "balls": {k: v for k, v in balls.items()},
        "baseBalls": [b["name"] for b in raw.get("baseBalls", []) if b.get("released", False)],
    }

    output_path = root.parent.parent.parent / "frontend" / "public" / "data" / "ballxpit.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output_path}")
    print(f"  total balls: {len(balls)}")
    for tier in sorted(set(b["tier"] for b in balls.values())):
        count = sum(1 for b in balls.values() if b["tier"] == tier)
        print(f"  tier {tier}: {count}")


if __name__ == "__main__":
    normalize()

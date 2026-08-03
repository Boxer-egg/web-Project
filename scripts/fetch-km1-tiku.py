"""Fetch the full subject-1 (科目一) question bank from the jsyks data CDN.

Pipeline (mirrors the original kms4 pipeline):
1. Read question IDs from ids.json (extracted from tk.mnks.cn/lianxiti).
2. Fetch each question JSON from tkdata.mnks.cn/ExamData/{id}.json.
3. Download referenced images from tkimg.mnks.cn.
4. Convert to the project's bank format at frontend/public/data/driving-license-c1.json
   and copy images to frontend/public/images/km1/.

Usage:
    python3 scripts/fetch-km1-tiku.py [--limit N]

Requires HTTP(S)_PROXY for outbound access.
"""
import argparse
import json
import os
import re
import shutil
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK_DIR = os.path.join(BASE_DIR, 'scripts', '.km1_raw')
IDS_FILE = os.path.join(WORK_DIR, 'ids.json')
RAW_FILE = os.path.join(WORK_DIR, 'tiku_raw.json')
ERR_FILE = os.path.join(WORK_DIR, 'errors.json')
IMG_DIR = os.path.join(WORK_DIR, 'images')
OUT_BANK = os.path.join(BASE_DIR, 'frontend', 'public', 'data', 'driving-license-c1.json')
OUT_IMG_DIR = os.path.join(BASE_DIR, 'frontend', 'public', 'images', 'km1')

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')
DATA_URL = 'https://tkdata.mnks.cn/ExamData/{}.json?CALL=?{}.json'
IMG_URL = 'https://tkimg.mnks.cn/i/{}.webp/jsyks'
OPTION_RE = re.compile(r'^[A-DＡ-Ｄ]、[\s]*')


def http_get(url, timeout=15):
    req = urllib.request.Request(url, headers={
        'User-Agent': UA,
        'Referer': 'https://www.jsyks.com/',
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_questions(ids, version, limit=None):
    """Fetch all question JSONs concurrently into tiku_raw.json."""
    if limit:
        ids = ids[:limit]
    results, errors = {}, {}
    if os.path.exists(RAW_FILE):
        with open(RAW_FILE, 'r', encoding='utf-8') as f:
            results = json.load(f)
    todo = [i for i in ids if i not in results]
    print(f'questions: total {len(ids)}, cached {len(results)}, to fetch {len(todo)}')

    def fetch_one(qid):
        try:
            return qid, json.loads(http_get(DATA_URL.format(qid, version))), None
        except Exception as e:
            return qid, None, str(e)

    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = {ex.submit(fetch_one, qid): qid for qid in todo}
        for i, fut in enumerate(as_completed(futures)):
            qid, data, err = fut.result()
            if err:
                errors[qid] = err
            else:
                results[qid] = data
            if (i + 1) % 200 == 0:
                print(f'progress {i + 1}/{len(todo)}')

    os.makedirs(WORK_DIR, exist_ok=True)
    with open(RAW_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False)
    if errors:
        with open(ERR_FILE, 'w', encoding='utf-8') as f:
            json.dump(errors, f, ensure_ascii=False, indent=2)
    print(f'questions done: ok {len(results)}, err {len(errors)}')
    return results


def fetch_images(raw):
    """Download every referenced image once into the work dir."""
    names = set()
    for item in raw.values():
        for field in ('tp', 'tv'):
            val = item.get(field) or ''
            if val:
                names.add(val.split('/')[-1].rsplit('.', 1)[0])
    os.makedirs(IMG_DIR, exist_ok=True)
    todo = [n for n in names if not os.path.exists(os.path.join(IMG_DIR, n + '.webp'))]
    print(f'images: total {len(names)}, to fetch {len(todo)}')

    def fetch_one(name):
        path = os.path.join(IMG_DIR, name + '.webp')
        try:
            with open(path, 'wb') as f:
                f.write(http_get(IMG_URL.format(name)))
            return name, None
        except Exception as e:
            return name, str(e)

    errors = {}
    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = {ex.submit(fetch_one, n): n for n in todo}
        for fut in as_completed(futures):
            name, err = fut.result()
            if err:
                errors[name] = err
    print(f'images done: err {len(errors)}')
    return errors


def parse_question(tm, tx):
    parts = re.split(r'<br\s*/?>', str(tm or ''))
    question = parts[0].strip()
    options = [OPTION_RE.sub('', p).strip() for p in parts[1:]]
    options = [o for o in options if o]
    return question, options


def parse_answer(da, tx):
    if tx == 1:
        return [1] if da == '错' else [0]
    indices = []
    for ch in str(da or '').strip().upper():
        code = ord(ch)
        if 65 <= code <= 68:
            indices.append(code - 65)
        elif 65313 <= code <= 65316:
            indices.append(code - 65313)
    return sorted(set(indices))


def map_type(tx):
    return {1: 'truefalse', 3: 'multiple'}.get(tx, 'single')


def map_picture(item):
    raw = item.get('tv') or item.get('tp') or ''
    if not raw:
        return ''
    base = raw.split('/')[-1].rsplit('.', 1)[0]
    return f'/images/km1/{base}.webp' if base else ''


def convert(raw, ids, version):
    """Convert raw items to the project bank format, ordered by ids."""
    questions = []
    for idx, qid in enumerate(ids):
        item = raw.get(qid)
        if not item:
            continue
        tx = int(item.get('tx') or 2)
        question, options = parse_question(item.get('tm', ''), tx)
        answer = parse_answer(str(item.get('da') or ''), tx)
        final_options = ['正确', '错误'] if tx == 1 else options
        if not answer or any(i < 0 or i >= len(final_options) for i in answer):
            print(f'skip invalid answer: {qid} da={item.get("da")}')
            continue
        questions.append({
            'id': f'kmy-{qid}',
            'type': map_type(tx),
            'question': question,
            'options': final_options,
            'answer': answer,
            'explain': '',
            'picture': map_picture(item),
            'chapter': item.get('tags') or '综合',
        })

    bank = {
        'meta': {
            'subject': 1,
            'licenseType': 'C1/C2',
            'version': version,
            'total': len(questions),
            'passScore': 90,
            'examDuration': 45,
            'examCount': 100,
        },
        'questions': questions,
    }
    with open(OUT_BANK, 'w', encoding='utf-8') as f:
        json.dump(bank, f, ensure_ascii=False, indent=2)
    print(f'wrote {len(questions)} questions -> {OUT_BANK}')

    os.makedirs(OUT_IMG_DIR, exist_ok=True)
    used = {q['picture'].split('/')[-1] for q in questions if q['picture']}
    copied = 0
    for name in used:
        src = os.path.join(IMG_DIR, name)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(OUT_IMG_DIR, name))
            copied += 1
    print(f'copied {copied}/{len(used)} images -> {OUT_IMG_DIR}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0, help='only fetch first N questions (for testing)')
    args = parser.parse_args()

    with open(IDS_FILE, 'r', encoding='utf-8') as f:
        payload = json.load(f)
    ids, version = payload['ids'], payload['version']
    print(f'ids: {len(ids)}, version: {version}')

    raw = fetch_questions(ids, version, limit=args.limit)
    fetch_images(raw)
    convert(raw, ids[:args.limit] if args.limit else ids, version)


if __name__ == '__main__':
    main()

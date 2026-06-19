"""Build paginated JSON question bank for the subject-4 driving test tool.

Reads raw question data from the local jsyks source directory and writes
per-page JSON files plus a meta index under frontend/public/data/jk.
Also copies question images to frontend/public/images/jk.
"""
import json, os, shutil

SRC_DIR = '/Users/box/new/Mac/food/通用资料/jsyks_kms4_sxlx_tiku_1550'
OUT_DIR = '/Users/box/new/Mac/web-Project/frontend/public/data/jk'
PAGE_DIR = os.path.join(OUT_DIR, 'pages')
IMG_SRC_DIR = os.path.join(SRC_DIR, 'images')
IMG_OUT_DIR = '/Users/box/new/Mac/web-Project/frontend/public/images/jk'

with open(os.path.join(SRC_DIR, 'tiku_raw.json'), 'r', encoding='utf-8') as f:
    raw = json.load(f)
with open(os.path.join(SRC_DIR, 'ids.json'), 'r', encoding='utf-8') as f:
    ids = json.load(f)

PAGE_SIZE = 20
os.makedirs(PAGE_DIR, exist_ok=True)

total = len(ids)
total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE

for p in range(1, total_pages + 1):
    start = (p - 1) * PAGE_SIZE
    page_ids = ids[start:start + PAGE_SIZE]
    page_data = [raw[qid] for qid in page_ids]
    with open(os.path.join(PAGE_DIR, f'page-{p:03d}.json'), 'w', encoding='utf-8') as f:
        json.dump(page_data, f, ensure_ascii=False, separators=(',', ':'))

meta = {'total': total, 'pageSize': PAGE_SIZE, 'totalPages': total_pages}
with open(os.path.join(OUT_DIR, 'meta.json'), 'w', encoding='utf-8') as f:
    json.dump(meta, f, ensure_ascii=False, separators=(',', ':'))

for name in ('tiku_raw.json', 'ids.json'):
    path = os.path.join(OUT_DIR, name)
    if os.path.exists(path):
        os.remove(path)

if os.path.isdir(IMG_SRC_DIR):
    os.makedirs(IMG_OUT_DIR, exist_ok=True)
    for fname in os.listdir(IMG_SRC_DIR):
        src = os.path.join(IMG_SRC_DIR, fname)
        dst = os.path.join(IMG_OUT_DIR, fname)
        if os.path.isfile(src):
            shutil.copy2(src, dst)
    print(f'copied images to {IMG_OUT_DIR}')
else:
    print(f'warning: image source directory not found: {IMG_SRC_DIR}')

print(f'generated {total_pages} pages, total {total} questions, page size {PAGE_SIZE}')

from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
out = root / 'assets' / 'images'
out.mkdir(parents=True, exist_ok=True)
images = {
    'community': 'image50.jpeg',
    'outdoor': 'image49.jpeg',
    'lecture': 'image17.jpeg',
    'walking-test': 'image44.jpeg',
    'school': 'image112.png',
    'workplace': 'image94.png',
    'park': 'image90.jpeg',
    'expert': 'expert.jpeg',
    'logo': 'image2.png',
}
for name, source in images.items():
    im = ImageOps.exif_transpose(Image.open(root / 'assets' / 'originals' / source)).convert('RGB')
    sizes = [640, 1280] if name not in ('expert', 'logo') else [480]
    for size in sizes:
        copy = im.copy()
        copy.thumbnail((size, size * 2), Image.Resampling.LANCZOS)
        copy.save(out / f'{name}-{size}.webp', 'WEBP', quality=82, method=6)
    if name == 'logo':
        im.thumbnail((64, 64), Image.Resampling.LANCZOS)
        im.save(out / 'favicon.png')
# Preserve the chosen homepage photograph and reproducible share image URL.
import hashlib, json
hero = ImageOps.exif_transpose(Image.open(root / 'assets' / 'originals' / 'home-walking-class.png')).convert('RGB')
hero.thumbnail((1280, 960), Image.Resampling.LANCZOS)
hero.save(out / 'hero-main-1280.webp', 'WEBP', quality=88, method=6)
ImageOps.fit(hero, (1200, 630), Image.Resampling.LANCZOS, centering=(0.5, 1.0)).save(out / 'social.jpg', quality=91, optimize=True)
share_name = 'social-' + hashlib.sha256((out / 'social.jpg').read_bytes()).hexdigest()[:12] + '.jpg'
(out / share_name).write_bytes((out / 'social.jpg').read_bytes())
config_path = root / 'site.config.json'
config = json.loads(config_path.read_text(encoding='utf-8'))
config['shareImage'] = '/assets/images/' + share_name
config['shareImageAlt'] = '대한바른자세걷기협회 실내 바른자세 걷기 운동 교육 현장'
config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(list(out.iterdir()))} optimized image assets')

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
hero = Image.open(out / 'community-1280.webp')
ImageOps.fit(hero, (1200, 630), centering=(0.5, 0.52)).save(out / 'social.jpg', quality=87)
print(f'Prepared {len(list(out.iterdir()))} optimized image assets')

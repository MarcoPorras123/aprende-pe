"""Generate the application's simple geometric sprout icon at platform sizes."""
from pathlib import Path
from PIL import Image, ImageDraw
import json

root = Path(__file__).resolve().parents[1]

def icon(size, path):
    image = Image.new('RGB', (1024, 1024), '#245c48')
    d = ImageDraw.Draw(image)
    d.line([(512, 750), (512, 485)], fill='#e4efcd', width=45)
    d.polygon([(510, 610), (420, 590), (330, 520), (290, 410), (405, 430), (485, 500)], fill='#e4efcd')
    d.polygon([(515, 610), (610, 580), (690, 500), (735, 390), (620, 415), (540, 490)], fill='#e4efcd')
    d.polygon([(512, 475), (450, 390), (460, 305), (512, 245), (565, 310), (570, 390)], fill='#ffffff')
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((size, size), Image.Resampling.LANCZOS).save(path)

for density, size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    icon(size,root/f'android/app/src/main/res/mipmap-{density}/ic_launcher.png')
assets = root/'ios/Runner/Assets.xcassets/AppIcon.appiconset'
for row in json.loads((assets/'Contents.json').read_text())['images']:
    if 'filename' in row:
        icon(round(float(row['size'].split('x')[0])*float(row['scale'][:-1])), assets/row['filename'])
for size in [192,512]:
    for name in [f'Icon-{size}.png',f'Icon-maskable-{size}.png']:
        icon(size,root/'web/icons'/name)
icon(32,root/'web/favicon.png')
manifest=json.loads((root/'web/manifest.json').read_text())
manifest.update(name='Aprende Pe!',short_name='Aprende Pe',description='Evalúate, practica y avanza a tu ritmo.',background_color='#f7f8f3',theme_color='#245c48')
(root/'web/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
index=root/'web/index.html'
text=index.read_text().replace('A new Flutter project.','Aprende Pe: evaluación, práctica y simulacros.').replace('aprende_pe_mobile','Aprende Pe!').replace('<html>','<html lang="es">')
index.write_text(text,encoding='utf-8')

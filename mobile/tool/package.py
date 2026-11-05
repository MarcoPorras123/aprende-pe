"""Package source and debug APK without secrets, local data or SDK caches."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

root = Path(__file__).resolve().parents[1]
dest = root / 'artifacts'
dest.mkdir(exist_ok=True)
excluded = {'.dart_tool', '.git', '.gradle', '.idea', 'build', 'artifacts', 'ephemeral', 'Pods', '.symlinks', '__pycache__'}
ignored_names = {'local.properties', '.flutter-plugins-dependencies', 'Generated.xcconfig', 'flutter_export_environment.sh', '.last_build_id', 'key.properties'}
files = [p for p in root.rglob('*') if p.is_file() and not any(part in excluded for part in p.relative_to(root).parts) and p.name not in ignored_names and not p.name.startswith('.env') and p.suffix not in {'.jks', '.keystore', '.log', '.pyc', '.iml'}]
with ZipFile(dest/'aprende-pe-flutter-fuentes.zip','w',ZIP_DEFLATED) as z:
    for p in sorted(files):
        z.write(p, Path('aprende-pe-mobile') / p.relative_to(root))
apk = root/'build/app/outputs/flutter-apk/app-debug.apk'
if apk.exists():
    shutil.copy2(apk, dest/'aprende-pe-android-prueba.apk')
with ZipFile(dest/'aprende-pe-flutter-fuentes.zip') as z:
    assert not any('.env' in Path(n).name or any(x in Path(n).parts for x in excluded) for n in z.namelist())
print(f'Source: {len(files)} files. No secrets, data or build caches included.')

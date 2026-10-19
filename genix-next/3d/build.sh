#!/bin/sh
# Rebuild the roadmap world: model in Blender, render the poster, then Draco-compress for the web.
set -e
cd "$(dirname "$0")/.."
/Applications/Blender.app/Contents/MacOS/Blender -b --python 3d/build_archipelago.py -- 3d/out --render
npx --yes @gltf-transform/cli@4 draco 3d/out/archipelago.raw.glb public/3d/archipelago.glb  # Draco decodes to float geometry, so animation pivots stay exact
cp 3d/out/anchors.json public/3d/anchors.json
cp 3d/out/archipelago-poster.webp public/3d/archipelago-poster.webp
ls -la public/3d

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps, ImageStat


paths = [
    Path("/private/tmp/bog-desktop-frame.png"),
    Path("/private/tmp/bog-rotation-frame.png"),
    Path("/private/tmp/bog-evidence-frame.png"),
    Path("/private/tmp/bog-mobile-outer.png"),
]
images = [Image.open(path).convert("RGB") for path in paths]

for path, image in zip(paths, images):
    quantized = image.resize((max(1, image.width // 8), max(1, image.height // 8))).quantize(colors=64)
    deviation = tuple(round(value, 1) for value in ImageStat.Stat(image).stddev)
    print(path.name, "size=", image.size, "std=", deviation, "palette_colors=", len(quantized.getcolors() or []))

for first, second in ((0, 1), (1, 2), (0, 2)):
    difference = ImageChops.difference(images[first], images[second])
    mean = tuple(round(value, 1) for value in ImageStat.Stat(difference).mean)
    print("mean_abs_diff", first, second, mean)

mobile = images[3].crop((437, 24, 828, 868))
mobile.save("/private/tmp/bog-mobile-frame.png")
mobile_deviation = tuple(round(value, 1) for value in ImageStat.Stat(mobile).stddev)
paper = (245, 241, 238)
pixels = list(mobile.resize((98, 211)).get_flattened_data())
nonpaper = sum(1 for pixel in pixels if sum(abs(pixel[index] - paper[index]) for index in range(3)) > 45)
print("mobile_crop", mobile.size, "std=", mobile_deviation)
print("mobile_nonpaper_ratio", round(nonpaper / len(pixels), 3))

source = Image.open("/Users/yjr/Downloads/ChatGPT Image Sep 14, 2026, 03_44_59 PM.png").convert("RGB")
implementation = images[2]
panel_size = (980, 700)
source_panel = ImageOps.pad(source, panel_size, color="#ede8e4")
implementation_panel = ImageOps.pad(implementation, panel_size, color="#ede8e4")
comparison = Image.new("RGB", (panel_size[0] * 2 + 36, panel_size[1] + 56), "#112b2a")
comparison.paste(source_panel, (0, 56))
comparison.paste(implementation_panel, (panel_size[0] + 36, 56))
draw = ImageDraw.Draw(comparison)
draw.text((18, 19), "SOURCE ART DIRECTION", fill="#f7f5f1")
draw.text((panel_size[0] + 54, 19), "IMPLEMENTED FINANCIAL REVEAL", fill="#f7f5f1")
comparison.save("/private/tmp/bog-design-comparison.png")

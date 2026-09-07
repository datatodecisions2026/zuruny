"""Swap the site's brand palette between the two options in the brand deck."""
import io, re, sys

PALETTES = {
    "A": {  # deck page 4, labelled "OPTION 2" — wine & olive
        "paper": "#FEF9E9", "paper-deep": "#F1E7CF", "card": "#FFFCF5",
        "blush": "#EAD4D6", "olive": "#6E7A3F",
        "char": "#252616", "char-soft": "#5C5C4C",
        "oxblood": "#51110F", "oxblood-deep": "#380B09",
        "bronze": "#6D2636", "gold": "#EAD4D6",
        "accent_rgb": "109 38 54",
    },
    "B": {  # deck page 12, labelled "OPTION 3" — olive & ochre
        "paper": "#F8F5D3", "paper-deep": "#EBE6BE", "card": "#FDFCEE",
        "blush": "#E4D9C0", "olive": "#666B32",
        "char": "#3A2216", "char-soft": "#6E5340",
        "oxblood": "#4F0D0F", "oxblood-deep": "#360809",
        "bronze": "#732530", "gold": "#D7A739",
        "accent_rgb": "115 37 48",
    },
}

def apply(key):
    p = PALETTES[key]
    path = "src/app/globals.css"
    s = io.open(path, encoding="utf-8").read()
    for token, value in p.items():
        if token == "accent_rgb":
            continue
        s = re.sub(rf"(--color-{token}:\s*)#[0-9a-fA-F]{{6}}", rf"\g<1>{value}", s)
    s = re.sub(r"rgb\(\d+ \d+ \d+ / ", f"rgb({p['accent_rgb']} / ", s)
    io.open(path, "w", encoding="utf-8").write(s)
    print(f"palette {key} applied")

if __name__ == "__main__":
    apply(sys.argv[1].upper())

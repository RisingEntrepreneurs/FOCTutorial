#!/usr/bin/env python3
"""Build index.html from src/ parts.

HTML sections are inserted in order before the final exam; scripts are
concatenated so that the core runs first, then A (which exposes FOC_DRAW),
then the other modules, then initialisation.
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")

HEAD = ["p01_head.html", "p02_shell.html", "p03_A01_A02.html", "p04_A03_A04.html",
        "p05_A05_A06.html", "p06_A07_A08.html"]
TAIL = "p07_tail.html"            # contains A-test, insert point, final exam, aside, footer
MODULE_HTML_PREFIXES = ("b", "c", "d", "e", "f", "x")
SCRIPTS = ["p08_core.js", "p10_questions.js", "p09_anims.js"]
MARK = "<!--SEGMENT_INSERT_POINT"


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()


def main():
    files = sorted(os.listdir(SRC))
    mod_html = [f for f in files if f.endswith(".html") and f[0] in MODULE_HTML_PREFIXES and f[1].isdigit()]
    mod_js = [f for f in files if f.endswith(".js") and f[0] in MODULE_HTML_PREFIXES and f[1] == "_"]
    mod_html.sort(key=lambda f: (MODULE_HTML_PREFIXES.index(f[0]), f))
    mod_js.sort(key=lambda f: (MODULE_HTML_PREFIXES.index(f[0]), "anims" in f, f))

    tail = read(TAIL)
    i = tail.index(MARK)
    out = "".join(read(f) for f in HEAD)
    out += tail[:i] + "".join(read(f) for f in mod_html) + tail[i:]
    for js in SCRIPTS + mod_js:
        out += "<script>\n" + read(js) + "\n</script>\n"
    out += '<script>document.readyState==="loading"?document.addEventListener("DOMContentLoaded",FOC_INIT):FOC_INIT();</script>\n'
    out += "</body>\n</html>\n"
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(out)
    print("index.html", len(out.encode("utf-8")), "bytes;", len(mod_html), "module html,", len(mod_js), "module js")


if __name__ == "__main__":
    main()

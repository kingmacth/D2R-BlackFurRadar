"""Package the supplied S16 Echoing Strike guide and its English translation."""
import base64
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path

root = Path(__file__).resolve().parent.parent
source = root / '高速开荒回响恶魔流.html'
html = source.read_text(encoding='utf-8-sig')
destination = root / 'public' / 'guides' / 's16'
destination.mkdir(parents=True, exist_ok=True)
translations = json.loads((destination / 'echo-demon.i18n.json').read_text(encoding='utf-8'))

class SourceText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.values = set()
    def handle_starttag(self, tag, attrs):
        if tag in ('style', 'script'):
            self.skip += 1
        for key, value in attrs:
            if value and key in ('alt', 'aria-label', 'data-h', 'title'):
                self.values.add(value.strip())
    def handle_endtag(self, tag):
        if tag in ('style', 'script'):
            self.skip -= 1
    def handle_data(self, text):
        if not self.skip:
            self.values.add(text.strip())

text = SourceText()
text.feed(html)
missing = [value for value in text.values if re.search('[\u3400-\u9fff]', value) and value not in translations['text']]
if missing:
    raise SystemExit('Missing translations: ' + json.dumps(missing, ensure_ascii=True))

def write(path, text):
    path.write_text('\n'.join(line.rstrip() for line in text.splitlines()).rstrip() + '\n', encoding='utf-8')

images = {}
def image_asset(match):
    data = base64.b64decode(match.group(1))
    name = 'echo-' + hashlib.sha256(data).hexdigest()[:12] + '.webp'
    (destination / name).write_bytes(data)
    images[name] = len(data)
    return '/guides/s16/' + name
html = re.sub(r'data:image/webp;base64,([A-Za-z0-9+/=]+)', image_asset, html)
html = re.sub(r'^\s*<link[^>]*https://fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*$', '', html, flags=re.M)
css = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', html, re.S))
html = re.sub(r'<style[^>]*>.*?</style>', '<link rel="stylesheet" href="/guides/s16/echo-demon.css" />', html, flags=re.S)
styles = {}
def style_class(match):
    name = styles.setdefault(match.group(1), 'echo-layout-' + str(len(styles)+1))
    return ' data-echo-layout="' + name + '"'
html = re.sub(r'\sstyle="([^"]*)"', style_class, html)
css += '\n' + '\n'.join('[data-echo-layout="' + name + '"]{' + value + '}' for value, name in styles.items())
css += '''
.sitebar{background:#171008;color:#f2ddbb;border-bottom:2px solid #bc551d}
.sitebar-inner{max-width:1100px;margin:auto;padding:13px 18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
.sitebar a{color:#ffc281;text-decoration:none;font-weight:700}.sitebar a:hover{text-decoration:underline}
.sitebar-controls{display:flex;align-items:center;flex-wrap:wrap;gap:10px}
.sitebar label{font-size:12px}.sitebar select{padding:7px 10px;border:1px solid #9b683e;border-radius:6px;background:#25190f;color:#f2ddbb}
.season-tag{font-weight:700;padding:5px 10px;border:1px solid #bc551d;border-radius:20px;font-size:12px;color:#ffc281}
:focus-visible{outline:3px solid #e39a47;outline-offset:3px}
.season-note{margin:18px auto 0;padding:12px 16px;border:1px solid var(--line);border-radius:10px;color:var(--ink2);font-size:13px}
@media(max-width:640px){.sitebar-inner{padding:12px 16px}.sitebar-controls{gap:8px}}
'''
html = html.replace('<body>', '''<body>
<div class="sitebar"><div class="sitebar-inner"><a href="/" id="echo-home">← 黑毛雷达</a><div class="sitebar-controls"><span class="season-tag">S16 · 第16赛季</span><label for="guide-language">显示语言</label><select id="guide-language"><option value="zh-CN">中文</option><option value="en">English</option></select></div></div></div>''')
html = html.replace('<div class="wrap">', '<div class="wrap"><p class="season-note" id="season-note"></p>', 1)
html = html.replace('<title>高速开荒回响恶魔流</title>', '<title>S16 · 高速开荒回响恶魔流</title>')
original = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', html, re.S))
html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.S)
html = html.replace('</body>', '<script type="module" src="/guides/s16/echo-demon.js"></script>\n</body>')

prefix = '''const bundle = await fetch('/guides/s16/echo-demon.i18n.json').then(response => {
  if (!response.ok) throw new Error('Could not load guide translations');
  return response.json();
});
let language = 'zh-CN';
try { language = localStorage.getItem('radar-language') === 'en' ? 'en' : 'zh-CN'; } catch (_) {}
const requested = new URLSearchParams(location.search).get('lang');
if (requested === 'en') language = 'en';
else if (requested === 'zh' || requested === 'zh-CN') language = 'zh-CN';
let renderCalculator = () => {};
const staticText = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  const node=walker.currentNode, original=node.textContent, source=original.trim();
  if (bundle.text[source]) staticText.push({node,original,source});
}
const attributes=[];
for (const element of document.querySelectorAll('[alt],[aria-label],[data-h],[title]')) {
  for (const name of ['alt','aria-label','data-h','title']) {
    const source=element.getAttribute(name);
    if (bundle.text[source]) attributes.push({element,name,source});
  }
}
function setLanguage(value) {
  language=value==='en'?'en':'zh-CN';
  const en=language==='en';
  for (const {node,original,source} of staticText) node.textContent=original.replace(source,en?bundle.text[source]:source);
  for (const {element,name,source} of attributes) element.setAttribute(name,en?bundle.text[source]:source);
  document.documentElement.lang=language;
  document.title=en?'S16 · Fast Leveling: Echoing Strike & Demons':'S16 · 高速开荒回响恶魔流';
  document.getElementById('echo-home').textContent=en?'← DClone Radar':'← 黑毛雷达';
  document.querySelector('.season-tag').textContent=en?'S16 · Season 16':'S16 · 第16赛季';
  document.querySelector('label[for="guide-language"]').textContent=en?'Language':'显示语言';
  document.getElementById('guide-language').value=language;
  document.getElementById('season-note').textContent=en?'S16 / Season 16 guide. Content and event notes are specific to this season; other seasons may differ.':'S16 / 第16赛季专用攻略。加点、配装与活动说明按本赛季保存，其他赛季可能不同。';
  try { localStorage.setItem('radar-language',language); } catch (_) {}
  const url=new URL(location.href); url.searchParams.set('lang',language); history.replaceState(null,'',url);
  renderCalculator();
}
'''
original = original.replace('var d = DATA[DATA.length - 1];', "var data = language === 'en' ? bundle.calculator : DATA;\n    var d = data[data.length - 1];")
original = original.replace('i < DATA.length', 'i < data.length').replace('lv <= DATA[i].max', 'lv <= data[i].max').replace('d = DATA[i]', 'd = data[i]')
original = original.replace("range.addEventListener('input', render);", "range.addEventListener('input', render);\n  renderCalculator = render;")
js = prefix + original + '''
document.getElementById('guide-language').addEventListener('change',event=>setLanguage(event.target.value));
setLanguage(language);
'''
write(destination / 'echo-demon.html', html)
write(destination / 'echo-demon.css', css)
write(destination / 'echo-demon.js', js)
assert not re.search(r'<script(?![^>]*src=)|<style|\sstyle=|\son\w+=', html, re.I)
print('Packaged S16 Echoing Strike guide:', len(translations['text']), 'translations;', images)

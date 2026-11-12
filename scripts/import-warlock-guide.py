"""Package the supplied bilingual guide without inline scripts or remote assets."""
import base64
import hashlib
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
source = root / '召唤术士开荒流程图.html'
html = source.read_text(encoding='utf-8-sig')
assert len(re.findall(r'<!doctype', html, re.I)) == 1
destination = root / 'public' / 'guides' / 's16'
destination.mkdir(parents=True, exist_ok=True)

def write_text_file(path, value):
    cleaned = '\n'.join(line.rstrip() for line in value.splitlines()).rstrip() + '\n'
    path.write_text(cleaned, encoding='utf-8')

# Both language versions share the same embedded image; store it only once.
images = {}
def image_asset(match):
    data = base64.b64decode(match.group(1))
    digest = hashlib.sha256(data).hexdigest()[:12]
    name = f'warlock-{digest}.webp'
    (destination / name).write_bytes(data)
    images[name] = len(data)
    return f'/guides/s16/{name}'
html = re.sub(r'data:image/webp;base64,([A-Za-z0-9+/=]+)', image_asset, html)
html = re.sub(r'^\s*<link[^>]*https://fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*$', '', html, flags=re.M)

styles = re.findall(r'<style[^>]*>(.*?)</style>', html, re.S)
html = re.sub(r'<style[^>]*>.*?</style>', '<link rel="stylesheet" href="/guides/s16/summon-warlock.css" />', html, flags=re.S)
inline_styles = {}
def style_class(match):
    value = match.group(1)
    name = inline_styles.setdefault(value, f'guide-layout-{len(inline_styles)+1}')
    return f' data-guide-layout="{name}"'
html = re.sub(r'\sstyle="([^"]*)"', style_class, html)
css = '\n'.join(styles)
css += '\n' + '\n'.join(f'[data-guide-layout="{name}"]{{{value}}}' for value,name in inline_styles.items())
css += '''
.radarbar a.brand { color:inherit; text-decoration:none; }
.radarbar a.brand:hover { text-decoration:underline; text-underline-offset:3px; }
:focus-visible { outline:3px solid var(--ember); outline-offset:3px; }
.grid { grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr)); }
@media(max-width:700px){ .cols[data-guide-layout] { grid-template-columns:1fr; } }
'''
write_text_file(destination / 'summon-warlock.css', css)

js = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', html, re.S))
html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.S)
html = html.replace('</body>', '<script src="/guides/s16/summon-warlock.js" defer></script>\n  </body>')
html = re.sub(r'<div class="brand">.*?<small id="radar-sub">(.*?)</small></div>',
              r'<a class="brand" href="/" id="radar-home"><span id="radar-brand">← 黑毛雷达 · S16 纯召唤</span><small id="radar-sub">\1</small></a>', html, count=1, flags=re.S)
html = html.replace('<span class="lbl">语言 Language</span>', '<span class="lbl" id="guide-language-label">显示语言</span>')
html = html.replace('<div class="wrap" id="wrapEn" hidden>', '<div class="wrap" id="wrapEn" lang="en" hidden>')
html = html.replace('<div class="wrap" id="wrapZh">', '<div class="wrap" id="wrapZh"><p class="note season-note">S16 / 第16赛季专用 · 纯召唤流派。其他赛季的加点、配装与活动可能不同。</p>')
html = html.replace('<div class="wrap" id="wrapEn" lang="en" hidden>', '<div class="wrap" id="wrapEn" lang="en" hidden><p class="note season-note">S16 / Season 16 · Pure summoner build. Skills, gear and events may differ in other seasons.</p>')

start = js.index('      function setLang(lang){')
end = js.index('      btnZh.addEventListener', start)
js = js[:start] + '''      function setLang(lang){
        var en = lang === 'en';
        var level = wrapZh.hidden ? lvEn.value : lvInput.value;
        lvInput.value = level; lvEn.value = level;
        render(); renderEn();
        wrapZh.hidden = en; wrapEn.hidden = !en;
        btnZh.classList.toggle('on', !en); btnEn.classList.toggle('on', en);
        btnZh.setAttribute('aria-pressed', String(!en));
        btnEn.setAttribute('aria-pressed', String(en));
        document.documentElement.lang = en ? 'en' : 'zh-CN';
        document.title = en ? 'Summon Warlock Leveling Guide · Season 16 · DClone Radar' : '召唤术士开荒流程图 · 第16赛季 · 黑毛雷达';
        document.getElementById('radar-brand').textContent = en ? '← DClone Radar · S16 Pure Summoner' : '← 黑毛雷达 · S16 纯召唤';
        document.getElementById('guide-language-label').textContent = en ? 'Language' : '显示语言';
        radarSub.textContent = en ? 'Summon Warlock · Season 16 · Skill points, gear and farming routes' : '召唤术士 · 第16赛季 · 加点、配装与刷图路线';
        try { localStorage.setItem('radar-language', en ? 'en' : 'zh-CN'); } catch (_) {}
        var url = new URL(location.href);
        url.searchParams.set('lang', en ? 'en' : 'zh-CN');
        history.replaceState(null, '', url);
        window.scrollTo(0,0);
      }
''' + js[end:]
start = js.index('      /* Honor ?lang=en')
js = js[:start] + '''      var requested = new URLSearchParams(location.search).get('lang');
      var preferred = 'zh-CN';
      try { preferred = localStorage.getItem('radar-language') || preferred; } catch (_) {}
      setLang(requested === 'en' ? 'en' : requested === 'zh' || requested === 'zh-CN' ? 'zh-CN' : preferred);
'''
write_text_file(destination / 'summon-warlock.js', js)
write_text_file(destination / 'summon-warlock.html', html)
assert not re.search(r'<script(?![^>]*src=)|<style|\sstyle=|\son\w+=', html, re.I)
print(f'Packaged bilingual guide: {len(html.encode())} HTML bytes; shared images: {images}')

const bundle = await fetch('/guides/s16/echo-demon.i18n.json').then(response => {
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

(function(){
  var DATA = [
    { max: 11,
      stage: "<strong>阶段一 · 悬浮起手</strong> —— 先把自己的输出立起来，恶魔只有 1 只羊头人凑合顶着。",
      skill: "悬浮精通 1 点 → 回响打击主升；召唤羊头人 1 点、劈斩 1 点过路。",
      attr: "力量够拿当前双手武器即可，其余全活力；精力 0 点。",
      gear: "面板最高的双手武器；衣服有隐秘就穿，13 级做钢铁。",
      task: "推普通进度，路过女伯爵顺手刷提尔（3号）、艾尔（1号）。" },
    { max: 17,
      stage: "<strong>阶段二 · 双恶魔解锁</strong> —— 恶魔精通冲到 5 硬点，第 2 只恶魔上场。",
      skill: "回响打击继续奔满；恶魔精通投到 5 硬点；污染魔 1 点、邪术冲击 1 点过路。",
      attr: "力量跟着新武器需求补，其余全活力。",
      gear: "武器换「力量」（安姆 11号 + 提尔 3号），压碎打击开始啃 Boss。",
      task: "符文不够就回刷普通女伯爵；推完普通前半段。" },
    { max: 29,
      stage: "<strong>阶段三 · 三恶魔 + 保命件</strong> —— 精通 10 硬点三只齐，位移、护盾、分摊一次配齐。",
      skill: "恶魔精通补到 10 硬点即停；飞刃传形、会心守御、血誓、死亡印记、污秽者各 1 点；回响满后转投镜影锋刃。",
      attr: "力量够穿装备，其余全活力——贴脸流的容错就是血池。",
      gear: "隐秘跑图、知识头盔（欧特 9号 + 索尔 12号）补 +1 技能；武器谁面板高用谁。",
      task: "推完普通，进噩梦前把保命技能全部点出。" },
    { max: 45,
      stage: "<strong>阶段四 · 束缚借力，镜影拉满</strong> —— 30 级束缚恶魔点 1 点抓光环恶魔，输出靠镜影清群。",
      skill: "束缚恶魔 1 点（不点高）；镜影锋刃点满；迟缓符印 1 点打 Boss；汲取咒印 1 点续航。",
      attr: "维持力量达标，其余全活力；蓝耗交给眼光解决，不投精力。",
      gear: "做「眼光」长柄自己拿（拉尔 8号 + 提尔 3号 + 塔尔 7号 + 索尔 12号）；佣兵换二幕进攻型。",
      task: "牛场刷白色长柄底材 + 拉苏克打孔；噩梦女伯爵补符文。" },
    { max: 65,
      stage: "<strong>阶段五 · 噩梦补强</strong> —— 功能补全、抗性拉满，为洗点转纯招做准备。",
      skill: "红液沸腾、暴食各 1 点；剩余点数回补悬浮精通与血誓。",
      attr: "力量够穿，其余全活力；重点检查四抗，别裸奔进地狱。",
      gear: "衣服换「烟雾」（耐夫 4号 + 卢姆 17号，+50 全抗）；噩梦墨菲斯托刷抗性散件。",
      task: "约 60–65 级杀完噩梦巴尔 → 用噩梦阿卡拉洗点转纯招。" }
  ];
  var range = document.getElementById('lvRange');
  var num = document.getElementById('lvNum');
  var el = {
    stage: document.getElementById('ckStage'),
    skill: document.getElementById('ckSkill'),
    attr: document.getElementById('ckAttr'),
    gear: document.getElementById('ckGear'),
    task: document.getElementById('ckTask')
  };
  function render(){
    var lv = parseInt(range.value, 10);
    num.textContent = lv;
    var data = language === 'en' ? bundle.calculator : DATA;
    var d = data[data.length - 1];
    for (var i = 0; i < data.length; i++){ if (lv <= data[i].max){ d = data[i]; break; } }
    el.stage.innerHTML = d.stage;
    el.skill.textContent = d.skill;
    el.attr.textContent = d.attr;
    el.gear.textContent = d.gear;
    el.task.textContent = d.task;
  }
  range.addEventListener('input', render);
  renderCalculator = render;
  render();
})();

document.getElementById('guide-language').addEventListener('change',event=>setLanguage(event.target.value));
setLanguage(language);

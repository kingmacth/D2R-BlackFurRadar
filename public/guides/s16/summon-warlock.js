
      var SNAPS = [
        {lv:1,  skill:"召唤羊头人 1。先召一只出来，它就是你前期的全部输出。", stat:"力量往 25–35 加，其余活力。敏捷、精力不加。", task:"推普通 A1：邪恶巢穴（+1 技能点别忘领）→ 救凯恩。"},
        {lv:5,  skill:"恶魔精通 5（硬点）→ 解锁第 2 只恶魔；羊头人约 2。", stat:"力量 25–35，其余活力。", task:"继续推 A1–A2，路过遗忘之塔就刷女伯爵攒塔尔、拉尔。"},
        {lv:6,  skill:"死亡印记 1 —— 把羊头人传送到怪脸上并降防，打精英/Boss 前先点名。", stat:"力量 25–35，其余活力。", task:"打安达利尔：先印记点名，两只羊围殴，你站柱子后面。"},
        {lv:12, skill:"羊头人约 7–8，恶魔精通 5，污染魔 1（过路）。", stat:"力量 35 左右，其余活力。", task:"推 A2–A3。开始留意 +羊头人/+恶魔技能的魔典。"},
        {lv:17, skill:"恶魔精通 10（硬点）→ 解锁第 3 只恶魔，三羊成军。", stat:"力量 35–45，其余活力。", task:"做隐密（塔尔7+伊司5）穿上，推图速度起飞，继续推 A4–A5。"},
        {lv:24, skill:"召唤羊头人 20 点满；过路各 1：污秽者、暴食、血誓、迟缓咒印、飞刃传形。", stat:"力量 45 左右，其余活力。", task:"普通巴尔 Run 练级；通关开普通牛场，捡水晶剑留给精神。"},
        {lv:27, skill:"死亡印记约 5–8，其余存点等 30 级。", stat:"力量补到 55，其余活力。", task:"做精神剑（拉苏克给水晶剑打 4 孔）+ 知识头；换噩梦 A2 力量光环佣兵，给他备眼光。"},
        {lv:30, skill:"束缚恶魔 1 —— 立刻抓第一只普通恶魔过渡；铸甲师等超级暗金要等束缚硬点满 20 才能抓。", stat:"力量 55–70，其余活力。", task:"推噩梦。记住：你死了、恶魔死了、洗点了，绑定都会解除，要重抓。"},
        {lv:40, skill:"束缚恶魔约 10+ —— 已可抓头目级恶魔，继续往满点冲。", stat:"力量 70–90 按装备补，其余活力。", task:"噩梦墨菲斯托开刷装备；佣兵眼光应该已经上手。"},
        {lv:49, skill:"束缚恶魔 20 点满 —— 解锁抓超级暗金（带狂热/信念光环的优先）。", stat:"力量按装备，其余活力。", task:"噩梦巴尔 Run 到 50+，抗性补一补准备进地狱。"},
        {lv:60, skill:"恶魔精通往 20 冲（约 15+），全队恶魔伤害/攻速持续涨。", stat:"决定精神盾就往力量 156 推；不做盾停在装备需求。其余活力。", task:"地狱 A1–A3：先看抗性面板，再刷地狱墨菲斯托和女伯爵。"},
        {lv:70, skill:"恶魔精通 20 满。死亡印记开始补，往 20 走。", stat:"力量定型（或 156），其余活力，血量目标 1000+。", task:"地狱通关杀巴尔；活动期全图恐惧 + 牛场轮刷，蹲黑毛场次。"},
        {lv:80, skill:"死亡印记 20 满；血誓补到约 12，给绑定恶魔加血上限和全抗。", stat:"力量定型，其余全活力。", task:"做战争召唤副手（先号令后体制）；补技能板、火炬、毁灭。"},
        {lv:90, skill:"毕业形态：束缚/精通/羊头人/死亡印记四满，血誓 ~12，富余点喂暴食。", stat:"力量 = 装备需求，敏捷 0，精力 0，活力拉满。", task:"恐惧地带轮刷 + 牛场 + 混沌庇难所，长期刷宝期。"}
      ];
      var lvInput = document.getElementById('lv');
      var lvNum = document.getElementById('lvnum');
      var quick = document.getElementById('quick');
      var marks = [1,6,12,17,24,27,30,40,49,60,70,80,90];
      marks.forEach(function(m){
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = 'Lv ' + m; b.setAttribute('data-m', m);
        b.addEventListener('click', function(){ lvInput.value = m; render(); });
        quick.appendChild(b);
      });
      function snapFor(lv){
        var s = SNAPS[0];
        for (var i=0;i<SNAPS.length;i++){ if (SNAPS[i].lv <= lv) s = SNAPS[i]; }
        return s;
      }
      function render(){
        var lv = parseInt(lvInput.value, 10);
        var s = snapFor(lv);
        lvNum.textContent = lv;
        document.getElementById('c-skill').textContent = s.skill;
        document.getElementById('c-stat').textContent = s.stat;
        document.getElementById('c-task').textContent = s.task;
        var btns = quick.querySelectorAll('button');
        btns.forEach(function(b){ b.classList.toggle('on', parseInt(b.getAttribute('data-m'),10) === s.lv); });
      }
      lvInput.addEventListener('input', render);
      render();


      /* ---- English level lookup (mirrors the Chinese SNAPS data) ---- */
      var SNAPS_EN = [
        {lv:1,  skill:"Summon Goatman 1. Summon one — it is your entire damage output for now.", stat:"Strength toward 25–35, rest Vitality. No Dexterity, no Energy.", task:"Push Normal A1: Den of Evil (claim the +1 skill point) → rescue Cain."},
        {lv:5,  skill:"Demon Mastery 5 (hard points) → unlocks the 2nd demon; Goatman ~2.", stat:"Strength 25–35, rest Vitality.", task:"Keep pushing A1–A2; farm the Countess for Tal and Ral whenever you pass the Tower."},
        {lv:6,  skill:"Death Mark 1 — teleports Goatmen onto the target and cuts its defense. Mark elites/bosses before engaging.", stat:"Strength 25–35, rest Vitality.", task:"Andariel: mark her, let both Goatmen maul her, stand behind a pillar."},
        {lv:12, skill:"Goatman ~7–8, Demon Mastery 5, Tainted Blood 1 (pathing).", stat:"Strength ~35, rest Vitality.", task:"Push A2–A3. Start watching for grimoires with +Goatman / +demon skills."},
        {lv:17, skill:"Demon Mastery 10 (hard points) → unlocks the 3rd demon. Army of three complete.", stat:"Strength 35–45, rest Vitality.", task:"Make Stealth (Tal #7 + Eth #5) and wear it — clear speed jumps. Push A4–A5."},
        {lv:24, skill:"Summon Goatman maxed at 20; 1 pt each in pathing: Defiler, Gluttony, Blood Pact, Sigil of Sloth, Blade Warp.", stat:"Strength ~45, rest Vitality.", task:"Normal Baal runs for XP; after clearing, open Normal Cows and pocket a Crystal Sword for Spirit."},
        {lv:27, skill:"Death Mark ~5–8, save the rest for Lv30.", stat:"Strength up to 55, rest Vitality.", task:"Make the Spirit sword (Larzuk: 4 sockets in the Crystal Sword) + Lore helm; switch to a Nightmare A2 Might merc and prep his Insight."},
        {lv:30, skill:"Bind Demon 1 — capture a first regular demon to get by; super uniques like Hephasto need Bind at 20 hard points.", stat:"Strength 55–70, rest Vitality.", task:"Push Nightmare. Remember: your death, the demon's death, or a respec breaks the bind — re-capture."},
        {lv:40, skill:"Bind Demon ~10+ — champion-tier captures unlocked; keep pushing to max.", stat:"Strength 70–90 as gear requires, rest Vitality.", task:"Start farming Nightmare Mephisto for gear; the merc's Insight should be online by now."},
        {lv:49, skill:"Bind Demon maxed at 20 — super-unique captures unlocked (aura carriers first: Fanaticism / Conviction).", stat:"Strength per gear, rest Vitality.", task:"Nightmare Baal runs to 50+, patch up resists, get ready for Hell."},
        {lv:60, skill:"Demon Mastery pushing to 20 (~15+), army damage / attack speed keep climbing.", stat:"Going Spirit shield? Push Strength to 156; otherwise stop at gear requirements. Rest Vitality.", task:"Hell A1–A3: check the resist panel first, then farm Hell Mephisto and Countess."},
        {lv:70, skill:"Demon Mastery maxed at 20. Death Mark next, heading to 20.", stat:"Strength locked (or 156), rest Vitality, life target 1000+.", task:"Clear Hell, kill Baal; during the event rotate full-map Terror Zones + Cows and sit the Uber Diablo slots."},
        {lv:80, skill:"Death Mark maxed at 20; Blood Pact to ~12 for the bound demon's life cap and all resists.", stat:"Strength locked, everything else Vitality.", task:"Build the Call to Arms off-hand (Command first, Orders second); chase skillers, Torch, Annihilus."},
        {lv:90, skill:"Graduated: Bind / Mastery / Goatman / Death Mark all maxed, Blood Pact ~12, surplus into Gluttony.", stat:"Strength = gear requirement, Dexterity 0, Energy 0, Vitality maxed.", task:"Long-term farming: Terror Zone rotation + Cows + Chaos Sanctuary."}
      ];
      var lvEn = document.getElementById('lvEn'), lvNumEn = document.getElementById('lvnumEn'), quickEn = document.getElementById('quickEn');
      [1,6,12,17,24,27,30,40,49,60,70,80,90].forEach(function(m){
        var b=document.createElement('button'); b.type='button'; b.textContent='Lv '+m; b.setAttribute('data-m',m);
        b.addEventListener('click',function(){ lvEn.value=m; renderEn(); }); quickEn.appendChild(b);
      });
      function renderEn(){
        var lv=parseInt(lvEn.value,10), s=SNAPS_EN[0];
        for (var i=0;i<SNAPS_EN.length;i++){ if (SNAPS_EN[i].lv<=lv) s=SNAPS_EN[i]; }
        lvNumEn.textContent=lv;
        document.getElementById('c-skill-en').textContent=s.skill;
        document.getElementById('c-stat-en').textContent=s.stat;
        document.getElementById('c-task-en').textContent=s.task;
        quickEn.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', parseInt(b.getAttribute('data-m'),10)===s.lv); });
      }
      lvEn.addEventListener('input', renderEn); renderEn();

      /* ---- Language switch: Chinese / English (in-session only) ---- */
      var wrapZh=document.getElementById('wrapZh'), wrapEn=document.getElementById('wrapEn');
      var btnZh=document.getElementById('btn-zh'), btnEn=document.getElementById('btn-en');
      var radarSub=document.getElementById('radar-sub');
      function setLang(lang){
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
      btnZh.addEventListener('click', function(){ setLang('zh'); });
      btnEn.addEventListener('click', function(){ setLang('en'); });
      var requested = new URLSearchParams(location.search).get('lang');
      var preferred = 'zh-CN';
      try { preferred = localStorage.getItem('radar-language') || preferred; } catch (_) {}
      setLang(requested === 'en' ? 'en' : requested === 'zh' || requested === 'zh-CN' ? 'zh-CN' : preferred);

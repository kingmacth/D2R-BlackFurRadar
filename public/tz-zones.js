// Online Terror Zone groups; stable IDs are independent of display language.
export const TZ_ZONES = [
  ['blood-moor',1,'鲜血荒地、邪恶洞窟','Blood Moor and Den of Evil'],
  ['cold-plains',1,'冰冷之原、洞窟','Cold Plains and The Cave'],
  ['burial-grounds',1,'埋骨之地、墓穴、大陵寝','Burial Grounds, Crypt, and Mausoleum'],
  ['stony-field',1,'石块旷野','Stony Field'],
  ['tristram',1,'崔斯特瑞姆','Tristram'],
  ['dark-wood',1,'黑暗森林、地下通道','Dark Wood and Underground Passage'],
  ['black-marsh',1,'黑色荒地、地穴','Black Marsh and The Hole'],
  ['tower',1,'遗忘之塔','The Forgotten Tower'],
  ['pit',1,'泰摩地穴（大坑）','The Pit'],
  ['jail',1,'监牢、军营','Jail and Barracks'],
  ['catacombs',1,'大教堂、地下墓穴','Cathedral and Catacombs'],
  ['cows',1,'秘密奶牛关','Moo Moo Farm'],
  ['sewers',2,'鲁高因下水道','Lut Gholein Sewers'],
  ['stony-tomb',2,'碎石荒地、石制古墓','Rocky Waste and Stony Tomb'],
  ['halls-dead',2,'干燥高地、死亡神殿','Dry Hills and Halls of the Dead'],
  ['far-oasis',2,'遥远的绿洲','Far Oasis'],
  ['lost-city',2,'遗失的城市、群蛇峡谷、利爪蝮蛇神殿','Lost City, Valley of Snakes, and Claw Viper Temple'],
  ['ancient-tunnels',2,'古代通道','Ancient Tunnels'],
  ['arcane',2,'神秘避难所','Arcane Sanctuary'],
  ['tal-rasha',2,'塔拉夏古墓、塔拉夏墓室','Tal Rasha\'s Tombs and Tal Rasha\'s Chamber'],
  ['spider',3,'蜘蛛森林、蜘蛛洞窟','Spider Forest and Spider Cavern'],
  ['great-marsh',3,'庞大湿地','Great Marsh'],
  ['flayer',3,'剥皮丛林、剥皮地窖','Flayer Jungle and Flayer Dungeon'],
  ['kurast',3,'库拉斯特商场、残破神殿、废弃圣殿','Kurast Bazaar, Ruined Temple, and Disused Fane'],
  ['travincal',3,'崔凡克','Travincal'],
  ['durance',3,'憎恨囚牢','Durance of Hate'],
  ['plains-despair',4,'外侧草原、绝望平原','Outer Steppes and Plains of Despair'],
  ['river-flame',4,'火焰之河、神罚之城','River of Flame and City of the Damned'],
  ['chaos',4,'混沌避难所','The Chaos Sanctuary'],
  ['foothills',5,'血腥丘陵、冰冻高地、亚巴顿','Bloody Foothills, Frigid Highlands, and Abaddon'],
  ['glacial',5,'冰河路径、漂泊者洞穴','Glacial Trail and Drifter Cavern'],
  ['crystalline',5,'水晶通道、冰河','Crystalline Passage and Frozen River'],
  ['arreat',5,'亚瑞特高原、冥河之洞','Arreat Plateau and Pit of Acheron'],
  ['nihlathak',5,'尼拉塞克神殿、痛苦之厅、苦痛之厅、瓦特之厅','Nihlathak\'s Temple and Temple Halls'],
  ['ancients-way',5,'远古之路、冰窖','Ancient\'s Way and Icy Cellar'],
  ['worldstone',5,'世界之石要塞、毁灭王座、世界之石大殿','Worldstone Keep, Throne of Destruction, and Worldstone Chamber'],
].map(([id,act,zh,en])=>({id,act,zh,en}));
const patterns = ['blood moor|den of evil','cold plains|the cave','burial grounds|mausoleum|\\bcrypt\\b','stony field','tristram','dark wood|underground passage','black marsh|the hole','forgotten tower','^the pit$|^pit$','jail|barracks','cathedral|catacombs','moo moo|cow level','sewers','rocky waste|stony tomb','dry hills|halls of the dead','far oasis','lost city|valley of snakes|claw viper','ancient tunnels','arcane sanctuary','tal rasha','spider forest|spider cavern','great marsh','flayer jungle|flayer dungeon','kurast bazaar|ruined temple|disused fane','travincal','durance','outer steppes|plains of despair','river of flame|city of the damned','chaos sanctuary','bloody foothills|frigid highlands|abaddon','glacial trail|drifter cavern','crystalline passage|frozen river','arreat plateau|acheron','nihlathak|halls of anguish|halls of pain|halls of vaught','ancient.?s.? way|icy cellar','worldstone|throne of destruction'];
export function zoneIds(name) {
  return TZ_ZONES.filter((_,i)=>new RegExp(patterns[i],'i').test(name)).map(z=>z.id);
}
export function zoneLabel(name, language) {
  if (language === 'en') return name;
  const ids=zoneIds(name);
  return ids.length ? TZ_ZONES.filter(z=>ids.includes(z.id)).map(z=>z.zh).join('；') : name;
}

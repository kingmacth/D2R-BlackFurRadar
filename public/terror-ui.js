import {TZ_ZONES,zoneLabel} from './tz-zones.js';
const $=id=>document.getElementById(id);
const en=()=>document.documentElement.lang==='en';
const text=(zh,english)=>en()?english:zh;
let draft=null,dirty=false,services;
const make=(tag,content,cls)=>{const e=document.createElement(tag); if(content!=null)e.textContent=content;if(cls)e.className=cls;return e;};
const time=at=>new Date(at).toLocaleString(en()?'en-US':'zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
export function initTerror(api) { services=api; }
export function renderTerror(data) {
  if(!$('terror-zone'))return;
  const publicBox=$('terror-zone'), d=data.terrorZone?.snapshot;
  publicBox.replaceChildren(make('p','TERROR ZONES','eyebrow'),make('h2',text('恐惧地带','Terror Zones')),
    make('p',text('在线全服统一 · 无需选择服务器 · 每 30 分钟轮换','Shared across online regions · No region selection · Rotates every 30 minutes'),'muted'));
  const fresh=d && Date.now()<d.nextAt;
  const grid=make('div',null,'tz-current-next');
  for(const next of [false,true]) {
    const card=make('div',null,'tz-card');
    card.append(make('p',next?text('下一轮','Up next'):text('当前区域','Current zone'),'eyebrow'));
    card.append(make('h3',fresh?(zoneLabel(next?d.next||'':d.current,document.documentElement.lang)||text('预测尚未发布','Prediction not published')):text('等待最新数据','Waiting for fresh data')));
    if(fresh) card.append(make('p',time(next?d.nextAt:d.startAt),'muted'));
    grid.append(card);
  }
  publicBox.append(grid);
  const status=make('p',null,'help');
  status.append(document.createTextNode(text('数据来自 ','Data courtesy of ')));
  const link=make('a','D2Runewizard');link.href='https://d2runewizard.com/tz-tracker';link.target='_blank';link.rel='noreferrer';status.append(link);
  if(d)status.append(document.createTextNode(` · ${text('最近查询','Last checked')} ${time(d.checkedAt)}`));
  publicBox.append(status);
  if(data.terrorZone?.error)publicBox.append(make('p',text('数据源暂时不可用，不会使用过期数据发送提醒。',data.terrorZone.error),'notice error'));
  if(!data.terror) return;
  if(!dirty)draft=structuredClone(data.terror.settings);
  const panel=$('terror-settings');
  // Preserve keyboard focus and unsubmitted selections across background refresh.
  const focus=document.activeElement?.dataset.zone;
  panel.replaceChildren(make('p','TERROR ZONE ALERTS','eyebrow'),make('h2',text('恐惧地带微信提醒','Terror Zone WeChat reminders')),
    make('p',text('勾选多个想刷的区域，仅下一轮命中时在开始前约 5 分钟提醒一次。云端每分钟检查，实际提前约 4–5 分钟；关闭页面仍有效。','Select the zones you want to farm. Matching upcoming zones trigger one WeChat reminder about 5 minutes before they start. Minute polling gives roughly 4–5 minutes of notice, even with this page closed.'),'muted'));
  const form=make('form');form.id='terror-form';
  const enabled=make('input');enabled.type='checkbox';enabled.id='tz-enabled';enabled.checked=draft.enabled;
  const toggle=make('label',null,'tz-toggle');toggle.append(enabled,document.createTextNode(text('启用恐惧地带提醒','Enable Terror Zone reminders')));form.append(toggle);
  const groups=make('div',null,'tz-zone-choices');
  for(let act=1;act<=5;act++){
    const field=make('fieldset');field.append(make('legend',text(`第 ${act} 幕`,`Act ${act}`)));
    for(const zone of TZ_ZONES.filter(z=>z.act===act)){
      const label=make('label'), input=make('input');input.type='checkbox';input.name='tz-zones';input.value=zone.id;input.dataset.zone=zone.id;input.checked=draft.zones.includes(zone.id);
      label.append(input,make('span',en()?zone.en:zone.zh));field.append(label);
    }
    groups.append(field);
  }
  form.append(groups,make('p',text('未勾选任何区域时不提醒。组合区域作为一个轮换单元订阅；同一轮命中多个订阅只发一条。预测缺失或数据过期时不发送。','No selected zones means no alerts. Linked areas are subscribed as one rotation group; multiple matches produce one message. Missing predictions and expired data never trigger alerts.'),'help'));
  const save=make('button',text('保存恐惧地带提醒','Save Terror Zone reminders'),'primary');save.type='submit';form.append(save);
  form.addEventListener('input',()=>{dirty=true;draft={enabled:enabled.checked,zones:[...form.querySelectorAll('[name="tz-zones"]:checked')].map(el=>el.value)};});
  form.addEventListener('submit',e=>{e.preventDefault();services.action(save,async()=>{
    await services.api('terror-settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(draft)});
    dirty=false;await services.refresh();services.notify(text('恐惧地带提醒已保存','Terror Zone reminders saved'));
  });});
  panel.append(form);
  if(data.terror.pushError)panel.append(make('p',text('恐惧地带微信推送失败，将在开始前重试。',data.terror.pushError),'notice error'));
  if(focus)panel.querySelector(`[data-zone="${focus}"]`)?.focus();
}

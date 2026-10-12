import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const { Window } = await import(process.env.HAPPY_DOM_MODULE || 'happy-dom');
const source = readFileSync(new URL('../clash-dashboard.js', import.meta.url), 'utf8');
const entity = 'select.clash_instance_figma';
function setup(callWS = async () => ({ response: { latency: { Figma: 29 } } }), config = {}) {
  const window = new Window();
  window.eval(source);
  const card = window.document.createElement('mihomo-dashboard');
  card.setConfig({ device_id: 'test-device', primary: entity, primary_group: 'Figma', groups: [['figma', 'Figma', '◈', 'Figma']], ...config });
  const state = (value, attributes = {}) => ({ state: value, attributes });
  card.hass = { states: {
    [entity]: state('DIRECT', { alive: true, options: ['DIRECT', 'node-B', 'Автовыбор'] }),
    'select.clash_instance_select': state('primary'),
    'select.clash_instance_global': state('global-node'),
    'select.clash_instance_avtovybor': state('fallback-A'),
    'select.clash_instance_proxy_mode': state('rule', {options: ['rule', 'global', 'direct']}),
  }, callWS, callService: async () => {} };
  window.document.body.append(card);
  const change = (id, value, attributes) => {
    card.hass = { ...card._hass, states: { ...card._hass.states,
      [id]: { ...card._hass.states[id], state: value, attributes: attributes || card._hass.states[id]?.attributes || {} } } };
  };
  return { card, change, window };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((a,b) => { resolve=a; reject=b; });
  return {promise, resolve, reject};
}
test('server and site checks use separate URLs and the selected group', async () => {
  const calls=[]; const {card}=setup(async x => {calls.push(x);return {response:{latency:{Figma:29}}};});
  assert.equal(await card._pingGroup(entity,'Figma'),true);
  assert.equal(await card._checkService(entity,'Figma'),true);
  assert.equal(calls[0].service_data.node,'Figma');
  assert.equal(calls[0].service_data.url,'http://www.gstatic.com/generate_204');
  assert.equal(calls[1].service_data.url,'https://www.figma.com/');
  assert.match(card.querySelector('.group-status').textContent,/Сайт ответил/);
  assert.ok(card._serviceChecks[entity].checkedAt);
});
test('successful result is cleared on server change',async()=>{
  const {card,change}=setup();await card._pingGroup(entity,'Figma');
  change(entity,'node-B');assert.equal(card._pings[entity],undefined);
  assert.match(card.querySelector('.ping-result').textContent,/ещё не проверен/);
});
for(const failure of [false,true]) test(`late ${failure?'error':'success'} is discarded after server change`,async()=>{
  const d=deferred();const {card,change}=setup(()=>d.promise);
  const p=card._pingGroup(entity,'Figma');change(entity,'node-B');
  failure?d.reject(new Error('old node error')):d.resolve({response:{latency:{Figma:25}}});
  assert.equal(await p,false);assert.equal(card._pings[entity],undefined);assert.equal(card._pingBusy[entity],false);
});
test('A to B to A does not accept an old response',async()=>{
  const d=deferred();const {card,change}=setup(()=>d.promise);const p=card._checkService(entity,'Figma');
  change(entity,'node-B');change(entity,'DIRECT');d.resolve({response:{latency:{Figma:20}}});
  assert.equal(await p,false);assert.equal(card._serviceChecks[entity],undefined);
});
test('fallback server changes invalidate diagnostics',async()=>{
  const {card,change}=setup();change(entity,'Автовыбор');await card._pingGroup(entity,'Figma');
  change('select.clash_instance_avtovybor','fallback-B');assert.equal(card._pings[entity],undefined);
});
test('global and direct modes explain bypass and disable site checks',async()=>{
  let calls=0;const {card,change}=setup(async()=>{calls++;return {};});
  change('select.clash_instance_proxy_mode','global');
  assert.match(card.querySelector('.hero-copy').textContent,/global-node/);
  assert.match(card.querySelector('.hero-copy').textContent,/не применяется/);
  assert.equal(card.querySelector('[data-service-entity]').disabled,true);
  assert.equal(await card._checkService(entity,'Figma'),false);assert.equal(calls,0);
  change('select.clash_instance_proxy_mode','direct');assert.match(card.querySelector('.hero-copy').textContent,/DIRECT/);
});
test('global node changes update the hero',()=>{
  const {card,change}=setup();change('select.clash_instance_proxy_mode','global');
  change('select.clash_instance_global','new-global');assert.match(card.querySelector('.hero-copy').textContent,/new-global/);
});
test('unavailable and unknown groups have accurate status and disabled controls',async()=>{
  for(const value of ['unavailable','unknown']) {
    const {card,change}=setup();change(entity,value,{alive:true,options:['DIRECT']});
    assert.match(card.querySelector('.group-status').textContent,/Нет связи с HA/);
    assert.equal(card.querySelector('[data-select-toggle]').disabled,true);
    assert.equal(card.querySelector('[data-ping-entity]').disabled,true);
    assert.equal(await card._pingGroup(entity,'Figma'),false);
  }
});
test('pending selection prevents publishing old diagnostics before HA state arrives',async()=>{
  const d=deferred();const {card}=setup(()=>d.promise);
  const p=card._pingGroup(entity,'Figma');
  card.querySelector('[data-select-toggle]').click();
  card.querySelector('[data-group-option="node-B"]').click();
  d.resolve({response:{latency:{Figma:20}}});assert.equal(await p,false);assert.equal(card._pings[entity],undefined);
});
test('diagnostic refresh preserves an open server menu and its scroll',async()=>{
  const {card}=setup();card.querySelector('[data-select-toggle]').click();
  const menu=card.querySelector('[data-select-menu]');menu.scrollTop=37;
  await card._pingGroup(entity,'Figma');
  assert.equal(card.querySelector('[data-select-menu]'),menu);assert.equal(menu.hidden,false);assert.equal(menu.scrollTop,37);
});
test('duplicate and overlapping diagnostic requests are suppressed',async()=>{
  const d=deferred();let calls=0;const {card}=setup(()=>{calls++;return d.promise;});
  const p=card._pingGroup(entity,'Figma');assert.equal(await card._pingGroup(entity,'Figma'),false);
  assert.equal(await card._checkService(entity,'Figma'),false);assert.equal(calls,1);
  d.resolve({response:{latency:{Figma:20}}});assert.equal(await p,true);
});
test('failed website check does not claim the service is blocked',async()=>{
  const {card}=setup(async()=>{throw new Error('403 or timeout');});await card._checkService(entity,'Figma');
  assert.match(card.querySelector('.service-row').textContent,/Нет подтверждённого ответа сайта/);
  assert.doesNotMatch(card.querySelector('.group-status').textContent,/Сайт ответил|заблокирован/);
});
test('array response shape is supported; invalid delays are not successes',async()=>{
  const {card}=setup(async()=>({response:{latency:[['Figma',18]]}}));assert.equal(await card._checkService(entity,'Figma'),true);
  for(const delay of [null,undefined,0,-1,'oops']){
    card._hass.callWS=async()=>({response:{latency:{Figma:delay}}});assert.equal(await card._checkService(entity,'Figma'),false);
  }
});
for(const failure of [false,true]) test(`mode change discards late site ${failure?'error':'success'}`,async()=>{
  const d=deferred();const {card,change}=setup(()=>d.promise);const p=card._checkService(entity,'Figma');
  change('select.clash_instance_proxy_mode','direct');
  failure?d.reject(new Error('old mode')):d.resolve({response:{latency:{Figma:20}}});
  assert.equal(await p,false);assert.equal(card._serviceChecks[entity],undefined);
});
test('HA disconnection disables cached selectors and discards pending checks',async()=>{
  const d=deferred();const {card}=setup(()=>d.promise);const p=card._pingGroup(entity,'Figma');
  card.hass={...card._hass,connected:false};
  assert.match(card.querySelector('.group-status').textContent,/Нет связи с HA/);
  assert.equal(card.querySelector('[data-select-toggle]').disabled,true);assert.equal(card._isOnline(),false);
  d.resolve({response:{latency:{Figma:20}}});assert.equal(await p,false);assert.equal(card._pings[entity],undefined);
});
test('Ping All distinguishes true failures from unavailable and busy groups',async()=>{
  const {card}=setup(async req=>{
    if(req.service_data.node==='Broken')throw new Error('timeout');
    return {response:{latency:{[req.service_data.node]:25}}};
  });
  card._config.groups=[['figma','Figma','◈','Figma'],['broken','Broken','!','Broken'],['busy','Busy','!','Busy'],['missing','Missing','!','Missing']];
  card._hass.states['select.clash_instance_broken']={state:'x',attributes:{options:['x']}};
  card._hass.states['select.clash_instance_busy']={state:'y',attributes:{options:['y']}};
  card._serviceBusy['select.clash_instance_busy']=true;
  await card._pingAll();
  assert.deepEqual({...card._pingAllSummary.counts},{success:1,error:1,skipped:2});
  assert.match(card.querySelector('.ping-all-summary').textContent,/пропущено: 2/);
  assert.equal(card._pingAllBusy,false);
});
test('Ping All counts route changes during a check as skipped',async()=>{
  const d=deferred();const {card,change}=setup(()=>d.promise);const p=card._pingAll();
  change(entity,'node-B');d.reject(new Error('old route timeout'));await p;
  assert.deepEqual({...card._pingAllSummary.counts},{success:0,error:0,skipped:1});
});
test('Ping All caps concurrency at two and suppresses a duplicate batch',async()=>{
  const requests=[];const {card}=setup(req=>{const d=deferred();requests.push({req,d});return d.promise;});
  card._config.groups=[['figma','Figma','◈','Figma'],['two','Two','!','Two'],['three','Three','!','Three']];
  for(const key of ['two','three'])card._hass.states['select.clash_instance_'+key]={state:'x',attributes:{options:['x']}};
  const batch=card._pingAll();await card._pingAll();assert.equal(requests.length,2);
  requests[0].d.resolve({response:{latency:{Figma:20}}});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests.length,3);
  requests[1].d.resolve({response:{latency:{Two:20}}});requests[2].d.resolve({response:{latency:{Three:20}}});await batch;
  assert.deepEqual({...card._pingAllSummary.counts},{success:3,error:0,skipped:0});
});
test('an old ping error is not reused when a new check is skipped',async()=>{
  const {card}=setup(async()=>{throw new Error('timeout');});await card._pingGroup(entity,'Figma');
  card._pendingSelections.add(entity);await card._pingAll();
  assert.deepEqual({...card._pingAllSummary.counts},{success:0,error:0,skipped:1});
});
test('Escape closes a menu and restores focus to its trigger',()=>{
  const {card,window}=setup();const trigger=card.querySelector('[data-select-toggle]');trigger.click();
  card.querySelector('[data-group-option]').focus();
  card.querySelector('[data-group-option]').dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(card._openMenuEntity,null);assert.equal(card.querySelector('[data-select-menu]').hidden,true);
  assert.equal(window.document.activeElement,trigger);
});
test('arrow keys and Home/End move focus without selecting a server',()=>{
  const {card,window}=setup();let selected=0;card._hass.callService=async()=>{selected++;};
  const trigger=card.querySelector('[data-select-toggle]');trigger.focus();
  trigger.dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
  const options=[...card.querySelectorAll('[data-group-option]')];assert.equal(window.document.activeElement,options[0]);
  options[0].dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));assert.equal(window.document.activeElement,options[1]);
  options[1].dispatchEvent(new window.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.equal(window.document.activeElement,options[2]);
  options[2].dispatchEvent(new window.KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert.equal(window.document.activeElement,options[0]);
  assert.equal(selected,0);
});
test('outside pointer press closes the menu; disconnect cleans up its listener',()=>{
  const {card,window}=setup();card.querySelector('[data-select-toggle]').click();
  window.document.body.dispatchEvent(new window.PointerEvent('pointerdown',{bubbles:true}));assert.equal(card._openMenuEntity,null);
  const handler=card._outsideListener;assert.ok(handler);card.remove();assert.equal(card._outsideListener,null);
  window.document.body.append(card);assert.ok(card._outsideListener);assert.notEqual(card._outsideListener,handler);
});
test('inside pointer press does not close an open menu',()=>{
  const {card,window}=setup();card.querySelector('[data-select-toggle]').click();
  card.querySelector('[data-group-option]').dispatchEvent(new window.PointerEvent('pointerdown',{bubbles:true,composed:true}));
  assert.equal(card._openMenuEntity,entity);
});
test('error details show timeout and safely escape diagnostic text',async()=>{
  const {card}=setup(async()=>{throw new Error('504 timeout <img src=x onerror=alert(1)>');});
  await card._checkService(entity,'Figma');const details=card.querySelector('.service-row details');
  assert.match(details.textContent,/Таймаут проверки/);assert.match(details.textContent,/www.figma.com/);
  assert.equal(details.querySelector('img'),null);details.open=true;card._render();assert.equal(card.querySelector('.service-row details').open,true);
});
test('global picker selects the GLOBAL entity with exact option text',async()=>{
  const {card,change}=setup();const global='select.clash_instance_global';
  change(global,'global-node',{options:['global-node',' 🇩🇪 DE, Франкфурт']});change('select.clash_instance_proxy_mode','global');
  const calls=[];card._hass.callService=async(...args)=>calls.push(args);
  const trigger=card._triggerFor(global);assert.ok(trigger);trigger.click();assert.ok(card.querySelector('.hero.is-menu-open'));
  card._menuFor(global).querySelectorAll('[data-group-option]')[1].click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.length,1);assert.equal(calls[0][2].entity_id,global);assert.equal(calls[0][2].option,' 🇩🇪 DE, Франкфурт');
  assert.equal(card._openMenuEntity,null);
});
test('global menu focus and scroll survive telemetry updates',()=>{
  const {card,change,window}=setup();const global='select.clash_instance_global';
  change(global,'global-node',{options:['global-node','node-B']});change('select.clash_instance_proxy_mode','global');
  card._triggerFor(global).click();let menu=card._menuFor(global);menu.scrollTop=29;menu.querySelectorAll('button')[1].focus();
  change('sensor.clash_instance_connection_number','150');menu=card._menuFor(global);
  assert.equal(menu.hidden,false);assert.equal(menu.scrollTop,29);assert.equal(window.document.activeElement.dataset.groupOption,'node-B');
});
test('a service group selected by GLOBAL is labelled as used globally',()=>{
  const {card,change}=setup();change('select.clash_instance_global','Figma',{options:['Figma','DIRECT']});
  change('select.clash_instance_proxy_mode','global');assert.match(card.querySelector('.group-card .select-wrap').textContent,/используется глобально/);
});
test('pointer press on another control inside the card closes the menu',()=>{
  const {card,window}=setup();card.querySelector('[data-select-toggle]').click();
  card.querySelector('[data-ping-all]').dispatchEvent(new window.PointerEvent('pointerdown',{bubbles:true,composed:true}));
  assert.equal(card._openMenuEntity,null);
});

for (const firstKind of ['site', 'ping']) {
  test(`newer failure overrides older ${firstKind} success, including equal timestamps`, async (t) => {
    let fail = false;
    const {card, window} = setup(async () => {
      if (fail) throw new Error('HTTP status 504');
      return {response: {latency: {Figma: 25}}};
    });
    const originalNow = window.Date.now;
    t.after(() => { window.Date.now = originalNow; });
    window.Date.now = () => 1000;
    const first = firstKind === 'site' ? '_checkService' : '_pingGroup';
    const second = firstKind === 'site' ? '_pingGroup' : '_checkService';
    await card[first](entity, 'Figma');
    fail = true;
    await card[second](entity, 'Figma');
    assert.match(card.querySelector('.group-status').textContent,
      firstKind === 'site' ? /Пинг не прошёл/ : /Проверка сайта не прошла/);
    fail = false;
    await card[second](entity, 'Figma');
    assert.match(card.querySelector('.group-status').textContent,
      firstKind === 'site' ? /Сервер отвечает/ : /Сайт ответил/);
  });
}

test('fallback telemetry refresh preserves results, open menu and scroll', async () => {
  const {card, change} = setup();
  change(entity, 'Автовыбор');
  await card._pingGroup(entity, 'Figma');
  await card._checkService(entity, 'Figma');
  const ping = card._pings[entity], site = card._serviceChecks[entity];
  card.querySelector('[data-select-toggle]').click();
  const menu = card.querySelector('[data-select-menu]');
  menu.scrollTop = 37;
  change('select.clash_instance_avtovybor', 'fallback-A', {history: [{delay: 45}]});
  assert.equal(card._pings[entity], ping);
  assert.equal(card._serviceChecks[entity], site);
  assert.equal(card.querySelector('[data-select-menu]'), menu);
  assert.equal(menu.scrollTop, 37);
  assert.equal(menu.hidden, false);
});

test('fallback telemetry during a pending check does not discard its response', async () => {
  const d = deferred();
  const {card, change} = setup(() => d.promise);
  change(entity, 'Автовыбор');
  const pending = card._pingGroup(entity, 'Figma');
  change('select.clash_instance_avtovybor', 'fallback-A', {history: [{delay: 46}]});
  d.resolve({response: {latency: {Figma: 30}}});
  assert.equal(await pending, true);
});

test('Ping All reports a failed primary route alongside successful service groups', async () => {
  const calls = [];
  const {card} = setup(async req => {
    const group = req.service_data.node;
    calls.push(group);
    if (group === 'Select') throw new Error('HTTP status 504');
    return {response: {latency: {[group]: 20}}};
  }, {primary: 'select.clash_instance_select', primary_group: 'Select'});
  await card._pingAll();
  assert.deepEqual(calls.sort(), ['Figma', 'Select']);
  assert.deepEqual({...card._pingAllSummary.counts}, {success: 1, error: 1, skipped: 0});
  assert.match(card.querySelector('.ping-all-summary').textContent, /Основной сервер.*ошибка/);
});

test('Ping All uses the configured primary API name and checks a visible primary only once', async () => {
  const calls = [];
  const {card} = setup(async req => {
    calls.push(req.service_data.node);
    return {response: {latency: {[req.service_data.node]: 20}}};
  }, {primary_group: ' Figma '});
  // A visible group already provides its exact API target.
  await card._pingAll();
  assert.deepEqual(calls, ['Figma']);
  card._config.primary = 'select.clash_instance_select';
  card._config.primary_group = ' Select ';
  calls.length = 0;
  await card._pingAll();
  assert.deepEqual(calls.sort(), [' Select ', 'Figma']);
});

for (const changeRoute of ['switch-back', 'fallback', 'mode', 'disconnect']) {
  test(`Ping All rejects a late primary result after ${changeRoute}`, async () => {
    const d = deferred();
    const primary = 'select.clash_instance_select';
    const {card, change} = setup(req => req.service_data.node === 'Select'
      ? d.promise : Promise.resolve({response: {latency: {Figma: 20}}}),
      {primary, primary_group: 'Select'});
    if (changeRoute === 'fallback') change(primary, 'Автовыбор');
    const batch = card._pingAll();
    await new Promise(resolve => setImmediate(resolve));
    if (changeRoute === 'switch-back') { change(primary, 'node-B'); change(primary, 'primary'); }
    if (changeRoute === 'fallback') change('select.clash_instance_avtovybor', 'fallback-B');
    if (changeRoute === 'mode') change('select.clash_instance_proxy_mode', 'direct');
    if (changeRoute === 'disconnect') card.hass = {...card._hass, connected: false};
    d.resolve({response: {latency: {Select: 20}}});
    await batch;
    assert.equal(card._pings[primary], undefined);
    const row = card._pingAllSummary.results.find(item => item.label === 'Основной сервер');
    assert.equal(row.status, 'skipped');
  });
}

test('Ping All explicitly reports a missing primary as skipped', async () => {
  const {card} = setup(undefined, {primary: 'select.absent', primary_group: 'Select'});
  await card._pingAll();
  assert.deepEqual({...card._pingAllSummary.counts}, {success: 1, error: 0, skipped: 1});
});

test('a public card has no implicit router destination', () => {
  const {card} = setup();
  assert.equal(card._config.router_url, '');
  assert.equal(card.querySelector('[data-router]'), null);
  card.setConfig({...card._config, router_url: 'https://router.example/ui/'});
  assert.ok(card.querySelector('[data-router]'));
});

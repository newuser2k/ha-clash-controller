/*
 * Mihomo Control — a self-contained Home Assistant Lovelace card.
 *
 * The card deliberately talks to Home Assistant entities and services only.
 * It never stores a Mihomo token and never calls the router API from the
 * browser.  Keep this file local to the HA instance; no CDN is required.
 */

const DEFAULT_CONFIG = {
  primary: "select.clash_instance_select",
  mode: "select.clash_instance_proxy_mode",
  device_id: "",
  ping_url: "http://www.gstatic.com/generate_204",
  ping_timeout: 5000,
  groups: [
    ["youtube", "YouTube", "▶", "YouTube"],
    ["telegram", "Telegram", "➤", "Telegram"],
    ["whatsapp", "WhatsApp", "◉", "WhatsApp"],
    ["ai", "AI", "✦", "AI"],
    ["tiktok", "TikTok", "♪", "TikTok"],
    ["games", "Игры", "⌘", "Games"],
  ],
  metrics: [
    ["download_speed", "Загрузка", "↓", "MB/s"],
    ["upload_speed", "Отдача", "↑", "MB/s"],
    ["connection_number", "Соединения", "⌁", ""],
    ["memory_used", "Память", "▣", "MB"],
  ],
  traffic: [
    ["download_traffic", "Получено", "↓", "GB"],
    ["upload_traffic", "Отправлено", "↑", "GB"],
  ],
  actions: [
    ["button.clash_instance_flush_dns_cache", "Очистить DNS", "⌁"],
    ["button.clash_instance_flush_fakeip_cache", "Очистить FakeIP", "↻"],
    ["ping_all", "Ping All", "⌁"],
  ],
  router_url: "",
};

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const shortValue = (value) => {
  const text = String(value ?? "—");
  return text.length > 28 ? `${text.slice(0, 26)}…` : text;
};

const countryCode = (value) => {
  const text = String(value ?? "");
  const flag = text.match(/[\u{1f1e6}-\u{1f1ff}]{2}/u)?.[0];
  if (flag) {
    return [...flag]
      .map((letter) => String.fromCodePoint(letter.codePointAt(0) - 0x1f1a5))
      .join("")
      .toLowerCase()
      .replace("uk", "gb");
  }
  return text.match(/(?:^|\s)(US|DE|IT|GB|UK|NL|EE|SE|TR|RU|JP)(?=\s|,|$)/i)?.[1]?.toLowerCase().replace("uk", "gb") || "";
};

const FLAG_MARKUP = {
  ru: '<rect width="20" height="14" fill="#fff"/><rect y="4.67" width="20" height="4.66" fill="#1d4ed8"/><rect y="9.33" width="20" height="4.67" fill="#ef4444"/>',
  it: '<rect width="6.67" height="14" fill="#169b62"/><rect x="6.67" width="6.66" height="14" fill="#fff"/><rect x="13.33" width="6.67" height="14" fill="#ce2b37"/>',
  gb: '<rect width="20" height="14" fill="#012169"/><path d="M0 0 20 14M20 0 0 14" stroke="#fff" stroke-width="3"/><path d="M0 0 20 14M20 0 0 14" stroke="#c8102e" stroke-width="1.3"/><path d="M10 0v14M0 7h20" stroke="#fff" stroke-width="4"/><path d="M10 0v14M0 7h20" stroke="#c8102e" stroke-width="2"/>',
  nl: '<rect width="20" height="14" fill="#ae1c28"/><rect y="4.67" width="20" height="4.66" fill="#fff"/><rect y="9.33" width="20" height="4.67" fill="#21468b"/>',
  ee: '<rect width="20" height="14" fill="#0072ce"/><rect y="4.67" width="20" height="4.66" fill="#000"/><rect y="9.33" width="20" height="4.67" fill="#fff"/>',
  se: '<rect width="20" height="14" fill="#006aa7"/><path d="M6 0h3v14H6zM0 5.5h20v3H0z" fill="#fecc00"/>',
  de: '<rect width="20" height="14" fill="#000"/><rect y="4.67" width="20" height="4.66" fill="#dd0000"/><rect y="9.33" width="20" height="4.67" fill="#ffce00"/>',
  tr: '<rect width="20" height="14" fill="#e30a17"/><circle cx="8" cy="7" r="4" fill="#fff"/><circle cx="9.6" cy="6.1" r="3.2" fill="#e30a17"/><polygon points="13.1,7 13.9,7.7 13.6,8.7 12.7,8.1 11.9,8.7 12.2,7.7 11.4,7 12.3,6.6 12.2,5.6 13.1,6.2 13.9,5.6 13.8,6.6 14.7,7" fill="#fff"/>',
  us: '<rect width="20" height="14" fill="#fff"/><path d="M0 0h20v1H0zM0 2h20v1H0zM0 4h20v1H0zM0 6h20v1H0zM0 8h20v1H0zM0 10h20v1H0zM0 12h20v1H0z" fill="#b22234"/><rect width="9.2" height="7.5" fill="#3c3b6e"/><g fill="#fff"><circle cx="1.3" cy="1.1" r=".45"/><circle cx="3.2" cy="1.1" r=".45"/><circle cx="5.1" cy="1.1" r=".45"/><circle cx="7" cy="1.1" r=".45"/><circle cx="2.25" cy="2.3" r=".45"/><circle cx="4.15" cy="2.3" r=".45"/><circle cx="6.05" cy="2.3" r=".45"/><circle cx="7.95" cy="2.3" r=".45"/><circle cx="1.3" cy="3.5" r=".45"/><circle cx="3.2" cy="3.5" r=".45"/><circle cx="5.1" cy="3.5" r=".45"/><circle cx="7" cy="3.5" r=".45"/><circle cx="2.25" cy="4.7" r=".45"/><circle cx="4.15" cy="4.7" r=".45"/><circle cx="6.05" cy="4.7" r=".45"/><circle cx="7.95" cy="4.7" r=".45"/><circle cx="1.3" cy="5.9" r=".45"/><circle cx="3.2" cy="5.9" r=".45"/><circle cx="5.1" cy="5.9" r=".45"/><circle cx="7" cy="5.9" r=".45"/></g>',
  jp: '<rect width="20" height="14" fill="#fff"/><circle cx="10" cy="7" r="3.3" fill="#bc002d"/>',
};

const countryFlagSvg = (code) => {
  const markup = FLAG_MARKUP[code];
  if (!markup) return "";
  return `<svg class="country-flag-svg" viewBox="0 0 20 14" aria-hidden="true" focusable="false">${markup}</svg>`;
};

const nodeLabel = (value, extraClass = "") => {
  const text = String(value ?? "—");
  const code = countryCode(text);
  const clean = text.replace(/[\u{1f1e6}-\u{1f1ff}]{2}/u, "").trim();
  return `<span class="node-label ${esc(extraClass)}">${countryFlagSvg(code)}<span>${esc(clean)}</span></span>`;
};

class MihomoDashboard extends HTMLElement {
  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Mihomo dashboard requires a card configuration");
    }
    this._config = {
      ...DEFAULT_CONFIG,
      ...config,
      groups: config.groups || DEFAULT_CONFIG.groups,
      metrics: config.metrics || DEFAULT_CONFIG.metrics,
      traffic: config.traffic || DEFAULT_CONFIG.traffic,
      actions: config.actions || DEFAULT_CONFIG.actions,
    };
    this._pings = this._pings || {};
    this._pingBusy = this._pingBusy || {};
    this._pingAllBusy = Boolean(this._pingAllBusy);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 12;
  }

  connectedCallback() {
    this._render();
  }

  _state(entityId) {
    return this._hass?.states?.[entityId] || null;
  }

  _stateValue(entityId, fallback = "—") {
    const state = this._state(entityId)?.state;
    return state === undefined || state === null || state === "unknown"
      ? fallback
      : state;
  }

  _metric(entityId, label, icon, unit) {
    const state = this._state(entityId);
    const value = state?.state;
    const formatted = value === undefined || value === null || value === "unknown"
      ? "—"
      : this._formatNumber(value);
    return `<div class="metric">
      <div class="metric-icon">${esc(icon)}</div>
      <div class="metric-copy"><span>${esc(label)}</span><strong>${esc(formatted)}<small>${esc(unit)}</small></strong></div>
    </div>`;
  }

  _formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return shortValue(value);
    if (Math.abs(number) >= 100) return number.toFixed(0);
    if (Math.abs(number) >= 10) return number.toFixed(1);
    return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  _groupCard(key, label, icon, apiGroup = label) {
    const entity = `select.clash_instance_${key}`;
    const state = this._state(entity);
    if (!state) return "";
    const alive = state.attributes?.alive !== false;
    const current = state.state;
    const options = Array.isArray(state.attributes?.options)
      ? state.attributes.options
      : [];
    const history = Array.isArray(state.attributes?.history)
      ? state.attributes.history
      : [];
    const lastDelay = history.length ? history[history.length - 1]?.delay : null;
    const ping = this._pings?.[entity] || null;
    const pingBusy = Boolean(this._pingBusy?.[entity]);
    const pingText = ping?.error
      ? ping.text || "Ping не выполнен"
      : Number.isFinite(Number(ping?.value))
        ? `${this._formatNumber(ping.value)} ms`
        : "Нажмите для проверки";
    const pingClass = ping?.error
      ? "is-error"
      : Number(ping?.value) < 80
        ? "is-good"
        : Number(ping?.value) < 160
          ? "is-ok"
          : Number.isFinite(Number(ping?.value))
            ? "is-slow"
            : "";
    const fastest = ping?.fastest && ping.fastest !== current
      ? `<span class="ping-fastest" title="Самый быстрый узел группы">быстрее: ${esc(shortValue(ping.fastest))}</span>`
      : "";
    const pingResult = pingBusy
      ? ""
      : `<span class="ping-result ${pingClass}">${esc(pingText)}</span>${fastest}`;
    const optionsHtml = options
      .map((option) => `<button type="button" class="node-option ${option === current ? "is-selected" : ""}" data-group-entity="${esc(entity)}" data-group-option="${esc(option)}" role="option" aria-selected="${option === current ? "true" : "false"}">${nodeLabel(option)}</button>`)
      .join("");
    return `<article class="group-card ${alive ? "is-alive" : "is-down"}">
      <div class="group-head"><span class="group-icon">${esc(icon)}</span><div><b>${esc(label)}</b><span class="group-status"><i></i>${alive ? "Доступен" : "Недоступен"}</span></div><span class="group-delay">${lastDelay ? `${esc(lastDelay)} ms` : ""}</span></div>
      <div class="group-current" title="${esc(current)}">${nodeLabel(shortValue(current))}</div>
      <div class="select-wrap"><span>Сервер</span><button type="button" class="node-select-trigger" data-select-toggle="${esc(entity)}" aria-haspopup="listbox" aria-expanded="false">${nodeLabel(shortValue(current))}<em>⌄</em></button><div class="node-options" data-select-menu="${esc(entity)}" role="listbox" hidden>${optionsHtml}</div></div>
      <div class="ping-row"><button class="ping-button ${pingBusy ? "is-busy" : ""}" data-ping-entity="${esc(entity)}" data-ping-group="${esc(apiGroup)}" aria-label="${pingBusy ? "Проверка задержки" : "Проверить задержку"}" title="${pingBusy ? "Проверка задержки…" : "Проверить задержку"}"${pingBusy ? " disabled" : ""}><span class="${pingBusy ? "ping-spinner" : "ping-glyph"}" aria-hidden="true">${pingBusy ? "" : "⌁"}</span>${pingBusy ? "" : "PING"}</button>${pingResult}</div>
    </article>`;
  }

  async _pingGroup(entity, groupName) {
    if (!this._hass || this._pingBusy?.[entity]) return;
    this._pingBusy[entity] = true;
    this._render();
    const current = this._state(entity)?.state;
    try {
      const result = await this._hass.callWS({
        type: "call_service",
        domain: "clash_controller",
        service: "get_latency_service",
        service_data: {
          device_id: this._config.device_id,
          group: groupName,
          url: this._config.ping_url,
          timeout: this._config.ping_timeout,
        },
        return_response: true,
      });
      const response = result?.response || result?.result?.response || {};
      const latency = Array.isArray(response.latency) ? response.latency : [];
      const exact = latency.find((row) => Array.isArray(row) && row[0] === current);
      const normalizedCurrent = String(current ?? "").trim();
      const match = exact || latency.find((row) => Array.isArray(row) && String(row[0] ?? "").trim() === normalizedCurrent);
      const value = match?.[1];
      if (!Number.isFinite(Number(value))) throw new Error("сервер не вернул задержку");
      if (this._state(entity)?.state !== current) {
        delete this._pings[entity];
        return;
      }
      const numeric = Number(value);
      this._pings[entity] = {
        value: numeric,
        fastest: response.fastest_node || null,
        kind: numeric < 80 ? "good" : numeric < 160 ? "ok" : "slow",
      };
    } catch (error) {
      this._pings[entity] = {
        error: true,
        text: error?.message || "ping не выполнен",
      };
    } finally {
      this._pingBusy[entity] = false;
      this._render();
    }
  }

  async _pingAll() {
    if (!this._hass || this._pingAllBusy) return;
    this._pingAllBusy = true;
    this._render();
    const groups = this._config.groups
      .map(([key, label, , apiGroup]) => ({
        entity: `select.clash_instance_${key}`,
        groupName: apiGroup || label,
      }))
      .filter(({ entity }) => this._state(entity));
    await Promise.allSettled(groups.map(({ entity, groupName }) => this._pingGroup(entity, groupName)));
    this._pingAllBusy = false;
    this._notice = { kind: "success", text: `Проверено групп: ${groups.length}` };
    this._render();
    window.clearTimeout(this._noticeTimer);
    this._noticeTimer = window.setTimeout(() => {
      this._notice = null;
      this._render();
    }, 3200);
  }

  _modeButtons() {
    const entity = this._config.mode;
    const state = this._state(entity);
    const current = state?.state;
    const options = state?.attributes?.options || ["rule", "global", "direct"];
    const labels = { rule: "По правилам", global: "Глобальный", direct: "Напрямую" };
    return options
      .map((option) => `<button class="mode-button ${option === current ? "is-selected" : ""}" data-mode-entity="${esc(entity)}" data-mode="${esc(option)}">${esc(labels[option] || option)}</button>`)
      .join("");
  }

  _trafficRows() {
    return this._config.traffic
      .map(([key, label, icon, unit]) => this._metric(`sensor.clash_instance_${key}`, label, icon, unit))
      .join("");
  }

  _updatedAt() {
    const id = this._config.primary;
    const date = this._state(id)?.last_updated || this._state(`sensor.clash_instance_connection_number`)?.last_updated;
    if (!date) return "данные ещё не получены";
    const age = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000));
    if (age < 60) return `обновлено ${age} сек назад`;
    return `обновлено ${Math.round(age / 60)} мин назад`;
  }

  _render() {
    if (!this._hass || !this._config) return;
    const primary = this._stateValue(this._config.primary);
    const mode = this._stateValue(this._config.mode, "rule");
    const connection = this._stateValue("sensor.clash_instance_connection_number", "0");
    const memory = this._stateValue("sensor.clash_instance_memory_used", "—");
    const groupCards = this._config.groups
      .map(([key, label, icon, apiGroup]) => this._groupCard(key, label, icon, apiGroup || label))
      .join("");
    const metricCards = this._config.metrics
      .map(([key, label, icon, unit]) => this._metric(`sensor.clash_instance_${key}`, label, icon, unit))
      .join("");
    const actionButtons = this._config.actions
      .map(([entity, label, icon]) => entity === "ping_all"
        ? `<button class="action-button ping-all-button ${this._pingAllBusy ? "is-busy" : ""}" data-ping-all="true" aria-label="Проверить все группы" title="Проверить все группы"${this._pingAllBusy ? " disabled" : ""}><span class="${this._pingAllBusy ? "ping-spinner" : "ping-all-icon"}" aria-hidden="true">${this._pingAllBusy ? "" : esc(icon)}</span>${esc(label)}</button>`
        : `<button class="action-button" data-action-entity="${esc(entity)}"><span>${esc(icon)}</span>${esc(label)}</button>`)
      .join("");

    this.innerHTML = `<style>${MihomoDashboard.styles}</style>
      <main class="shell">
        <header class="topbar">
          <div class="brand"><span class="brand-mark">◈</span><div><span class="overline">CUDY ROUTER</span><h1>Proxy control</h1></div></div>
          <div class="top-actions"><span class="online"><i></i> Mihomo online</span><button class="router-button" data-router="true">Открыть полную панель <span>↗</span></button></div>
        </header>

        <section class="hero">
          <div class="hero-copy"><span class="overline">ТЕКУЩИЙ МАРШРУТ</span><h2 title="${esc(primary)}">${nodeLabel(shortValue(primary), "hero-node")}</h2><p>Режим <b>${esc(mode)}</b> · <b>${esc(connection)}</b> активных соединений · <b>${esc(memory)} MB</b> памяти</p></div>
          <div class="mode-panel"><span class="overline">РЕЖИМ РАБОТЫ</span><div class="mode-buttons">${this._modeButtons()}</div></div>
        </section>

        <section class="section"><div class="section-title"><div><span class="overline">LIVE TELEMETRY</span><h3>Состояние подключения</h3></div><span class="updated">${esc(this._updatedAt())}</span></div><div class="metrics">${metricCards}</div></section>

        <section class="section"><div class="section-title"><div><span class="overline">ROUTING GROUPS</span><h3>Маршрутизация сервисов</h3></div><span class="section-hint">Выбор применяется сразу</span></div><div class="groups">${groupCards}</div></section>

        <section class="bottom-grid"><div class="panel"><div class="panel-title"><span class="panel-icon">↯</span><div><span class="overline">TRAFFIC TOTAL</span><h3>Всего трафика</h3></div></div><div class="traffic">${this._trafficRows()}</div></div><div class="panel"><div class="panel-title"><span class="panel-icon">⚙</span><div><span class="overline">QUICK ACTIONS</span><h3>Быстрые действия</h3></div></div><div class="actions">${actionButtons}</div></div></section>

        <footer><span>Clash Controller · локальное управление</span><span>v1.19.30 · API через Home Assistant</span></footer>
        ${this._notice ? `<div class="notice ${this._notice.kind}">${esc(this._notice.text)}</div>` : ""}
      </main>`;
    this._bindEvents();
  }

  _bindEvents() {
    this.querySelectorAll("button[data-select-toggle]").forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        const target = event.currentTarget;
        const wrapper = target.closest(".select-wrap");
        const menu = wrapper?.querySelector("[data-select-menu]");
        const expanded = target.getAttribute("aria-expanded") === "true";
        this.querySelectorAll("button[data-select-toggle]").forEach((other) => other.setAttribute("aria-expanded", "false"));
        this.querySelectorAll("[data-select-menu]").forEach((other) => { other.hidden = true; });
        if (!expanded && menu) {
          target.setAttribute("aria-expanded", "true");
          menu.hidden = false;
        }
      });
    });
    this.querySelectorAll("button[data-group-option]").forEach((optionButton) => {
      optionButton.addEventListener("click", async (event) => {
        const target = event.currentTarget;
        const entityId = target.dataset.groupEntity;
        const option = target.dataset.groupOption;
        delete this._pings[entityId];
        await this._call("select", "select_option", { entity_id: entityId, option }, `Маршрут изменён: ${option}`);
      });
    });
    this.querySelectorAll("button[data-ping-entity]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const target = event.currentTarget;
        this._pingGroup(target.dataset.pingEntity, target.dataset.pingGroup);
      });
    });
    this.querySelector("button[data-ping-all]")?.addEventListener("click", () => this._pingAll());
    this.querySelectorAll("button[data-mode-entity]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.currentTarget;
        await this._call("select", "select_option", { entity_id: target.dataset.modeEntity, option: target.dataset.mode }, `Режим: ${target.dataset.mode}`);
      });
    });
    this.querySelectorAll("button[data-action-entity]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        await this._call("button", "press", { entity_id: event.currentTarget.dataset.actionEntity }, "Команда отправлена");
      });
    });
    this.querySelector("button[data-router]")?.addEventListener("click", () => window.open(this._config.router_url, "_blank", "noopener"));
  }

  async _call(domain, service, data, successText) {
    if (!this._hass) return;
    try {
      await this._hass.callService(domain, service, data);
      this._notice = { kind: "success", text: successText };
    } catch (error) {
      this._notice = { kind: "error", text: `Ошибка: ${error?.message || "команда не выполнена"}` };
    }
    this._render();
    window.clearTimeout(this._noticeTimer);
    this._noticeTimer = window.setTimeout(() => {
      this._notice = null;
      this._render();
    }, 3200);
  }

  static styles = `
    :host { display:block; color:#eef4ff; --ink:#eef4ff; --muted:#8e9bb4; --line:rgba(159,180,216,.16); --panel:rgba(20,29,48,.78); --accent:#70a7ff; --accent2:#9f7bff; --ok:#52dfae; --danger:#ff6f8d; }
    * { box-sizing:border-box; }
    .shell { position:relative; overflow:hidden; min-height:720px; padding:28px; border:1px solid rgba(155,180,225,.2); border-radius:28px; background:radial-gradient(900px 460px at 90% -10%,rgba(90,125,255,.22),transparent 65%), radial-gradient(700px 380px at -10% 30%,rgba(93,220,190,.09),transparent 65%), #0a1020; font-family:var(--primary-font-family, Inter, ui-sans-serif, system-ui, sans-serif); box-shadow:0 24px 80px rgba(0,0,0,.3); }
    .shell:before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.23; background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px); background-size:40px 40px; mask-image:linear-gradient(to bottom,black,transparent 80%); }
    .topbar,.hero,.section,.bottom-grid,footer { position:relative; z-index:1; }
    .topbar { display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:30px; }
    .brand { display:flex; align-items:center; gap:13px; }.brand-mark { display:grid; place-items:center; width:40px; height:40px; border:1px solid rgba(129,169,255,.55); border-radius:13px; color:#a9c6ff; background:linear-gradient(145deg,rgba(107,149,255,.28),rgba(154,106,255,.12)); font-size:22px; box-shadow:0 0 28px rgba(85,126,255,.2); }.overline { display:block; color:#7686a4; font-size:10px; font-weight:750; letter-spacing:.16em; text-transform:uppercase; }h1,h2,h3,p { margin:0; }h1 { margin-top:3px; font-size:18px; font-weight:650; letter-spacing:-.02em; }.top-actions { display:flex; align-items:center; gap:12px; }.online { color:#a7b4c9; font-size:12px; white-space:nowrap; }.online i,.group-status i { display:inline-block; width:7px; height:7px; margin-right:6px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 4px rgba(82,223,174,.1),0 0 13px rgba(82,223,174,.7); }.router-button,.action-button,.mode-button { border:1px solid var(--line); color:#bac8df; background:rgba(255,255,255,.045); cursor:pointer; transition:.2s ease; }.router-button { padding:10px 13px; border-radius:11px; font-size:12px; }.router-button:hover,.action-button:hover,.mode-button:hover { border-color:rgba(130,171,255,.62); color:#fff; background:rgba(108,150,255,.13); transform:translateY(-1px); }
    .hero { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr); gap:25px; align-items:end; padding:30px; margin-bottom:31px; border:1px solid rgba(143,174,235,.2); border-radius:22px; background:linear-gradient(115deg,rgba(34,49,80,.8),rgba(20,28,50,.65)); }.hero-copy h2 { margin-top:8px; overflow:hidden; color:#fff; font-size:clamp(29px,4vw,50px); font-weight:650; letter-spacing:-.055em; text-overflow:ellipsis; white-space:nowrap; }.hero-copy p { margin-top:11px; color:#8f9db6; font-size:12px; }.hero-copy p b { color:#d6e1f4; font-weight:600; }.mode-panel { padding:17px; border:1px solid rgba(143,174,235,.14); border-radius:16px; background:rgba(4,10,24,.3); }.mode-buttons { display:flex; gap:7px; margin-top:11px; }.mode-button { flex:1; min-height:38px; border-radius:9px; font-size:11px; }.mode-button.is-selected { border-color:rgba(128,172,255,.8); color:#fff; background:linear-gradient(135deg,rgba(96,143,255,.35),rgba(152,103,255,.28)); box-shadow:inset 0 0 20px rgba(112,157,255,.12),0 5px 18px rgba(79,118,244,.14); }
    .section { margin-bottom:31px; }.section-title { display:flex; justify-content:space-between; align-items:end; gap:15px; margin-bottom:14px; }.section-title h3,.panel-title h3 { margin-top:4px; color:#dfe8f8; font-size:16px; font-weight:600; letter-spacing:-.02em; }.updated,.section-hint { color:#74839e; font-size:11px; }.metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }.metric { display:flex; align-items:center; gap:12px; min-height:73px; padding:14px; border:1px solid var(--line); border-radius:15px; background:var(--panel); }.metric-icon { display:grid; place-items:center; flex:none; width:31px; height:31px; border-radius:9px; color:#91b6ff; background:rgba(108,153,255,.13); font-size:18px; }.metric-copy { min-width:0; }.metric-copy span { display:block; overflow:hidden; color:#7f8da7; font-size:11px; text-overflow:ellipsis; white-space:nowrap; }.metric-copy strong { display:block; margin-top:4px; color:#e7efff; font-size:18px; font-weight:650; }.metric-copy small { margin-left:3px; color:#7889a6; font-size:10px; font-weight:500; }
    .groups { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }.group-card { min-width:0; padding:16px; border:1px solid var(--line); border-radius:16px; background:var(--panel); transition:.2s ease; }.group-card:hover { border-color:rgba(130,171,255,.42); background:rgba(28,40,67,.85); transform:translateY(-2px); }.group-card.is-down { border-color:rgba(255,111,141,.35); }.group-head { display:flex; align-items:center; min-width:0; gap:10px; }.group-icon { display:grid; place-items:center; flex:none; width:31px; height:31px; border-radius:9px; color:#a5c3ff; background:linear-gradient(145deg,rgba(114,161,255,.2),rgba(159,123,255,.14)); font-size:15px; }.group-head b { display:block; overflow:hidden; color:#d9e4f7; font-size:13px; font-weight:600; text-overflow:ellipsis; white-space:nowrap; }.group-status { display:block; margin-top:4px; color:#70809c; font-size:10px; }.group-delay { margin-left:auto; color:#8394b2; font-size:10px; white-space:nowrap; }.group-current { overflow:hidden; margin:16px 0 13px; color:#f0f5ff; font-size:15px; font-weight:600; text-overflow:ellipsis; white-space:nowrap; }.node-label { display:inline-flex; align-items:center; min-width:0; gap:8px; }.node-label > span:last-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.hero-node { gap:12px; }.country-flag-svg { display:inline-block; flex:none; width:1.45em; height:1em; overflow:hidden; border:1px solid rgba(255,255,255,.28); border-radius:2px; box-shadow:0 1px 4px rgba(0,0,0,.28); vertical-align:-.12em; }.country-flag { display:inline-block; flex:none; width:1.3em; height:.86em; border:1px solid rgba(255,255,255,.25); border-radius:2px; background:#71819e; box-shadow:0 1px 4px rgba(0,0,0,.25); }.flag-ru { background:linear-gradient(to bottom,#fff 0 33%,#1d4ed8 33% 66%,#ef4444 66%); }.flag-it { background:linear-gradient(to right,#169b62 0 33%,#fff 33% 66%,#ce2b37 66%); }.flag-gb { background:linear-gradient(to right,transparent 42%,#fff 42% 58%,transparent 58%),linear-gradient(to bottom,transparent 42%,#fff 42% 58%,transparent 58%),linear-gradient(to right,transparent 46%,#cf142b 46% 54%,transparent 54%),linear-gradient(to bottom,transparent 46%,#cf142b 46% 54%,transparent 54%),#012169; }.flag-nl { background:linear-gradient(to bottom,#ae1c28 0 33%,#fff 33% 66%,#21468b 66%); }.flag-ee { background:linear-gradient(to bottom,#0072ce 0 33%,#000 33% 66%,#fff 66%); }.flag-se { background:linear-gradient(to right,transparent 35%,#fecc00 35% 48%,transparent 48%),linear-gradient(to bottom,transparent 42%,#fecc00 42% 58%,transparent 58%),#006aa7; }.flag-de { background:linear-gradient(to bottom,#000 0 33%,#dd0000 33% 66%,#ffce00 66%); }.flag-tr { background:radial-gradient(circle at 38% 50%,#fff 0 27%,transparent 28%),radial-gradient(circle at 46% 50%,#e30a17 0 21%,transparent 22%),#e30a17; }.flag-us { background:linear-gradient(#3c3b6e 0 55%,transparent 55%) 0 0/52% 55% no-repeat,repeating-linear-gradient(to bottom,#b22234 0 14%,#fff 14% 28%); }.flag-jp { background:radial-gradient(circle at center,#bc002d 0 32%,transparent 34%),#fff; }.select-wrap { position:relative; display:block; z-index:2; }.select-wrap > span:first-child { display:block; margin-bottom:5px; color:#6e7e9b; font-size:10px; }.node-select-trigger { position:relative; display:flex; align-items:center; width:100%; min-height:34px; padding:0 28px 0 9px; border:1px solid rgba(141,171,224,.18); border-radius:8px; outline:none; color:#aebbd1; background:#121c31; cursor:pointer; text-align:left; font:inherit; font-size:11px; }.node-select-trigger:focus { border-color:var(--accent); }.node-select-trigger em { position:absolute; right:10px; color:#7e92b5; pointer-events:none; font-style:normal; }.node-options { position:absolute; top:calc(100% + 5px); right:0; left:0; z-index:5; max-height:230px; overflow-y:auto; padding:5px; border:1px solid rgba(141,171,224,.24); border-radius:10px; background:#121c31; box-shadow:0 14px 30px rgba(0,0,0,.38); }.node-option { display:flex; align-items:center; width:100%; min-height:31px; padding:6px 7px; border:0; border-radius:6px; color:#aebbd1; background:transparent; cursor:pointer; text-align:left; font:inherit; font-size:11px; }.node-option:hover,.node-option.is-selected { color:#fff; background:rgba(108,150,255,.18); }.group-card:focus-within,.select-wrap:focus-within { position:relative; z-index:10; }.ping-row { display:flex; align-items:center; gap:8px; min-width:0; margin-top:12px; }.ping-button { display:inline-flex; align-items:center; gap:5px; flex:none; min-height:29px; padding:0 9px; border:1px solid rgba(112,167,255,.32); border-radius:8px; color:#b9d0ff; background:rgba(112,167,255,.1); cursor:pointer; font:inherit; font-size:10px; font-weight:700; letter-spacing:.07em; transition:.2s ease; }.ping-button:hover { border-color:rgba(130,171,255,.8); color:#fff; background:rgba(108,150,255,.22); transform:translateY(-1px); }.ping-button:disabled { cursor:wait; opacity:.7; transform:none; }.ping-button span { color:#86b0ff; font-size:14px; line-height:1; }.ping-button .ping-spinner { width:12px; height:12px; border:2px solid rgba(134,176,255,.3); border-top-color:#fff; border-radius:50%; animation:ping-spin .8s linear infinite; }.ping-result { overflow:hidden; color:#7888a4; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.ping-result.is-good { color:var(--ok); }.ping-result.is-ok { color:#f3ca72; }.ping-result.is-slow,.ping-result.is-error { color:var(--danger); }.ping-fastest { overflow:hidden; margin-left:auto; color:#6f80a0; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }@keyframes ping-spin { to { transform:rotate(360deg); } }
    .bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }.panel { padding:18px; border:1px solid var(--line); border-radius:16px; background:var(--panel); }.panel-title { display:flex; align-items:center; gap:10px; margin-bottom:17px; }.panel-icon { display:grid; place-items:center; width:31px; height:31px; border-radius:9px; color:#b99fff; background:rgba(159,123,255,.15); }.traffic { display:grid; grid-template-columns:1fr 1fr; gap:9px; }.traffic .metric { min-height:58px; padding:10px; background:rgba(255,255,255,.025); }.traffic .metric-icon { width:26px; height:26px; font-size:15px; }.traffic .metric-copy strong { font-size:15px; }.actions { display:flex; flex-wrap:wrap; gap:9px; }.action-button { display:flex; align-items:center; gap:8px; min-height:39px; padding:0 12px; border-radius:9px; font-size:11px; }.action-button span { color:#96b8ff; font-size:16px; }.action-button .ping-spinner { width:13px; height:13px; border:2px solid rgba(150,184,255,.3); border-top-color:#fff; border-radius:50%; animation:ping-spin .8s linear infinite; }footer { display:flex; justify-content:space-between; gap:10px; margin-top:25px; padding-top:15px; border-top:1px solid var(--line); color:#64738e; font-size:10px; }.notice { position:absolute; z-index:3; right:24px; bottom:20px; padding:10px 14px; border:1px solid rgba(82,223,174,.4); border-radius:10px; color:#ccffed; background:#12352f; box-shadow:0 10px 30px rgba(0,0,0,.3); font-size:12px; }.notice.error { border-color:rgba(255,111,141,.5); color:#ffd5de; background:#3e1725; }
    @media (max-width:820px) { .shell { padding:18px; border-radius:20px; }.topbar,.section-title,footer { align-items:flex-start; flex-direction:column; }.top-actions { width:100%; justify-content:space-between; }.hero { grid-template-columns:1fr; padding:21px; }.metrics { grid-template-columns:repeat(2,1fr); }.groups { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:540px) { .metrics,.groups,.bottom-grid { grid-template-columns:1fr; }.mode-buttons { flex-direction:column; }.mode-button { min-height:34px; }.hero-copy h2 { font-size:32px; }.router-button { padding:9px 10px; }.online { font-size:11px; } }
  `;
}

if (!customElements.get("mihomo-dashboard")) {
  customElements.define("mihomo-dashboard", MihomoDashboard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "mihomo-dashboard")) {
  window.customCards.push({
    type: "mihomo-dashboard",
    name: "Mihomo Control",
    description: "Полноэкранная панель управления Clash/Mihomo",
    preview: false,
    documentationURL: "https://github.com/myhades/ha-clash-controller",
  });
}

/*
 * Mihomo Control v17 — a self-contained Home Assistant Lovelace card.
 *
 * The card deliberately talks to Home Assistant entities and services only.
 * It never stores a Mihomo token and never calls the router API from the
 * browser. Configure instance-specific settings in Lovelace; no CDN is required.
 */

const DEFAULT_CONFIG = {
  primary: "select.clash_instance_select",
  primary_group: "Select",
  update_entity: "update.clash_controller_update",
  mode: "select.clash_instance_proxy_mode",
  device_id: "",
  ping_url: "http://www.gstatic.com/generate_204",
  ping_timeout: 5000,
  global: "select.clash_instance_global",
  service_urls: {
    Figma: "https://www.figma.com/",
    YouTube: "https://www.youtube.com/generate_204",
    Telegram: "https://telegram.org/",
    WhatsApp: "https://www.whatsapp.com/",
    AI: "https://chatgpt.com/",
    TikTok: "https://www.tiktok.com/",
  },
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
    this._serviceChecks = this._serviceChecks || {};
    this._serviceBusy = this._serviceBusy || {};
    this._routeRevisions = this._routeRevisions || {};
    this._detailOpen = this._detailOpen || new Set();
    this._pendingSelections = this._pendingSelections || new Set();
    this._pingAllBusy = Boolean(this._pingAllBusy);
    this._openMenuEntity = this._openMenuEntity || null;
    this._render();
  }

  set hass(hass) {
    const previous = this._hass;
    this._hass = hass;
    if (!previous || !this._config || !this.querySelector(".shell")) {
      this._render();
    } else {
      this._updateFromHass(previous);
    }
  }

  getCardSize() {
    return 12;
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  disconnectedCallback() {
    if (this._outsideListener) this.ownerDocument.removeEventListener("pointerdown", this._outsideListener);
    this._outsideListener = null;
  }

  _state(entityId) {
    return this._hass?.states?.[entityId] || null;
  }

  _stateValue(entityId, fallback = "—") {
    const state = this._state(entityId)?.state;
    return state === undefined || state === null || state === "unknown" || state === "unavailable"
      ? fallback
      : state;
  }

  _isOnline() {
    const state = this._state(this._config.primary)?.state;
    return this._hass?.connected !== false && Boolean(state && state !== "unknown" && state !== "unavailable");
  }

  _onlineMarkup() {
    const online = this._isOnline();
    return `<span class="online ${online ? "" : "is-offline"}"><i></i> Mihomo ${online ? "online" : "offline"}</span>`;
  }

  _versionBadge() {
    const installed = this._state(this._config.update_entity)?.attributes?.installed_version;
    const version = installed || this._state(this._config.primary)?.attributes?.integration_version;
    if (!version) return '<span class="version-badge is-unavailable" title="Версия интеграции недоступна">v—</span>';
    return `<span class="version-badge" title="Установленная версия Clash Controller">v${esc(String(version).replace(/^v/i, ""))}</span>`;
  }

  _heroCopy() {
    const mode = this._stateValue(this._config.mode, "—");
    const primary = mode === "direct" ? "DIRECT" : this._stateValue(mode === "global" ? this._config.global : this._config.primary);
    const heading = mode === "rule" ? "ОСНОВНОЙ СЕРВЕР" : "ОБЩИЙ МАРШРУТ";
    const explanation = mode === "rule" ? "Сервисы используют собственные группы; остальные соединения — правила Clash."
      : mode === "global" ? "Весь трафик через глобальную группу. Маршрутизация по правилам не применяется; выбранная группа управляет всем трафиком."
        : mode === "direct" ? "Весь трафик напрямую. Выбор отдельных сервисов не применяется." : "Режим недоступен.";
    const connection = this._stateValue("sensor.clash_instance_connection_number");
    const memory = this._stateValue("sensor.clash_instance_memory_used");
    const formattedMemory = Number.isFinite(Number(memory)) ? Math.round(Number(memory)) : memory;
    return `<span class="overline">${heading}</span><h2 title="${esc(primary)}">${nodeLabel(shortValue(primary), "hero-node")}</h2><p>Режим <b>${esc({rule: "По правилам", global: "Глобальный", direct: "Напрямую"}[mode] || mode)}</b> · <b>${esc(connection)}</b> активных соединений · <b>${esc(formattedMemory)} MB</b> памяти</p><p>${esc(explanation)}</p>${mode === "global" ? this._globalPicker() : ""}`;
  }

  _globalPicker() {
    const entity = this._config.global;
    const state = this._state(entity);
    const available = this._hass?.connected !== false && state && !["unknown", "unavailable"].includes(state.state);
    const pending = this._pendingSelections.has(entity);
    const open = this._openMenuEntity === entity;
    const options = state?.attributes?.options || [];
    return `<div class="select-wrap global-selector"><span>Глобальный сервер или группа</span><button type="button" class="node-select-trigger" data-select-toggle="${esc(entity)}" aria-haspopup="listbox" aria-expanded="${open}"${!available || pending ? " disabled" : ""}>${nodeLabel(state?.state || "Нет связи с HA")}<em>⌄</em></button><div class="node-options" data-select-menu="${esc(entity)}" role="listbox" aria-label="Глобальный сервер"${open ? "" : " hidden"}>${options.map(option => `<button type="button" class="node-option ${option === state.state ? "is-selected" : ""}" data-group-entity="${esc(entity)}" data-group-option="${esc(option)}" role="option" aria-selected="${option === state.state}"${!available || pending ? " disabled" : ""}>${nodeLabel(option)}</button>`).join("")}</div></div>`;
  }

  _updateFromHass(previous) {
    const changed = (entityId) => previous.states?.[entityId] !== this._hass.states?.[entityId];
    const primaryChanged = changed(this._config.primary);
    const modeChanged = changed(this._config.mode);
    const connectionChanged = previous.connected !== this._hass.connected;
    const metricsChanged = this._config.metrics.some(([key]) => changed(`sensor.clash_instance_${key}`));
    const trafficChanged = this._config.traffic.some(([key]) => changed(`sensor.clash_instance_${key}`));

    if (primaryChanged || changed(this._config.update_entity)) {
      this.querySelector(".version-badge").outerHTML = this._versionBadge();
    }
    if (primaryChanged || connectionChanged) this.querySelector(".online").outerHTML = this._onlineMarkup();
    if (primaryChanged || modeChanged || changed(this._config.global) || changed("sensor.clash_instance_connection_number") || changed("sensor.clash_instance_memory_used")) {
      const active = this.ownerDocument.activeElement;
      const focusedOption = active?.dataset?.groupEntity === this._config.global ? active.dataset.groupOption : null;
      const globalMenu = this._menuFor(this._config.global);
      const scroll = globalMenu?.scrollTop || 0;
      this.querySelector(".hero-copy").innerHTML = this._heroCopy();
      const replacement = this._menuFor(this._config.global);
      if (replacement) {
        replacement.scrollTop = scroll;
        if (focusedOption !== null) [...replacement.querySelectorAll("[data-group-option]")].find(button => button.dataset.groupOption === focusedOption)?.focus();
      }
    }
    if (modeChanged && this._openMenuEntity === this._config.global) this._closeMenu(false);
    if (connectionChanged && this._stateValue(this._config.mode) === "global") this.querySelector(".hero-copy").innerHTML = this._heroCopy();
    if (modeChanged) {
      this.querySelector(".mode-buttons").innerHTML = this._modeButtons();
      this.querySelector(".section-hint").textContent = this._routingHint();
    }
    if (metricsChanged) {
      this.querySelector(".metrics").innerHTML = this._config.metrics
        .map(([key, label, icon, unit]) => this._metric(`sensor.clash_instance_${key}`, label, icon, unit)).join("");
    }
    if (trafficChanged) this.querySelector(".traffic").innerHTML = this._trafficRows();

    // Track every checked route, including the primary even without a group card.
    const routeChanges = new Map();
    for (const { entity } of this._diagnosticGroups()) {
      const before = previous.states?.[entity];
      const after = this._state(entity);
      const fallbackChanged = after?.state === "Автовыбор"
        && previous.states?.["select.clash_instance_avtovybor"]?.state !== this._state("select.clash_instance_avtovybor")?.state;
      const globalChanged = this._stateValue(this._config.mode) === "global"
        && previous.states?.[this._config.global]?.state !== this._state(this._config.global)?.state;
      const routeChanged = before?.state !== after?.state || modeChanged || fallbackChanged || connectionChanged || globalChanged;
      routeChanges.set(entity, routeChanged);
      if (routeChanged) this._invalidateChecks(entity);
    }
    const groupsRoot = this.querySelector(".groups");
    for (const [key, label, icon, apiGroup] of this._config.groups) {
      const entity = `select.clash_instance_${key}`;
      const before = previous.states?.[entity];
      const after = this._state(entity);
      const routeChanged = routeChanges.get(entity);
      if (!changed(entity) && !routeChanged) continue;
      const existing = [...groupsRoot.children].find((card) => card.dataset.groupCard === entity);
      const sameOptions = JSON.stringify(before?.attributes?.options || []) === JSON.stringify(after?.attributes?.options || []);
      if (!routeChanged && existing && before?.state === after?.state && before?.attributes?.alive === after?.attributes?.alive && sameOptions) {
        const history = after?.attributes?.history || [];
        const delay = history[history.length - 1]?.delay;
        existing.querySelector(".group-delay").textContent = delay ? `${delay} ms` : "";
        continue;
      }
      const next = this._groupCard(key, label, icon, apiGroup || label);
      if (!existing || !next) {
        groupsRoot.innerHTML = this._config.groups
          .map(([groupKey, groupLabel, groupIcon, groupApi]) => this._groupCard(groupKey, groupLabel, groupIcon, groupApi || groupLabel)).join("");
        break;
      }
      const scroll = existing.querySelector("[data-select-menu]")?.scrollTop || 0;
      existing.outerHTML = next;
      const replacement = [...groupsRoot.children].find((card) => card.dataset.groupCard === entity);
      if (replacement) replacement.querySelector("[data-select-menu]").scrollTop = scroll;
    }
    this.querySelector(".updated").textContent = this._updatedAt();
  }

  _metric(entityId, label, icon, unit) {
    const state = this._state(entityId);
    const value = state?.state;
    const formatted = value === undefined || value === null || value === "unknown" || value === "unavailable"
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
    if (Math.abs(number) >= 10) return number.toFixed(1).replace(/\.0$/, "");
    return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  _groupCard(key, label, icon, apiGroup = label) {
    const entity = `select.clash_instance_${key}`;
    const state = this._state(entity);
    if (!state) return "";
    const menuOpen = this._openMenuEntity === entity;
    const selectionBusy = this._pendingSelections.has(entity);
    const available = this._hass?.connected !== false && !["unknown", "unavailable"].includes(state.state);
    const alive = available && state.attributes?.alive !== false;
    const status = this._groupStatus(entity);
    const current = state.state;
    const mode = this._stateValue(this._config.mode);
    const routeUsage = mode === "rule" ? "" : mode === "global" && this._stateValue(this._config.global) === apiGroup ? " · используется глобально" : " · правила сервиса отключены";
    const options = Array.isArray(state.attributes?.options)
      ? state.attributes.options
      : [];
    const history = Array.isArray(state.attributes?.history)
      ? state.attributes.history
      : [];
    const lastDelay = history.length ? history[history.length - 1]?.delay : null;
    const optionsHtml = options
      .map((option) => `<button type="button" class="node-option ${option === current ? "is-selected" : ""}" data-group-entity="${esc(entity)}" data-group-option="${esc(option)}" role="option" aria-selected="${option === current ? "true" : "false"}"${selectionBusy || !available ? " disabled" : ""}>${nodeLabel(option)}</button>`)
      .join("");
    return `<article data-group-card="${esc(entity)}" class="group-card ${alive ? "is-alive" : "is-down"} ${menuOpen ? "is-menu-open" : ""}">
      <div class="group-head"><span class="group-icon">${esc(icon)}</span><div><b>${esc(label)}</b><span class="group-status"><i></i>${esc(status)}</span></div><span class="group-delay">${lastDelay ? `${esc(lastDelay)} ms` : ""}</span></div>
      <div class="group-current" title="${esc(current)}">${nodeLabel(shortValue(current))}</div>
      <div class="select-wrap"><span>Маршрут сервиса${esc(routeUsage)}</span><button type="button" class="node-select-trigger" data-select-toggle="${esc(entity)}" aria-haspopup="listbox" aria-expanded="${menuOpen ? "true" : "false"}"${selectionBusy || !available ? ' disabled aria-label="Выбор сервера недоступен"' : ""}>${nodeLabel(shortValue(current))}<em>⌄</em></button><div class="node-options" data-select-menu="${esc(entity)}" role="listbox"${menuOpen ? "" : " hidden"}>${optionsHtml}</div></div>
      ${this._pingRow(entity, apiGroup, current)}
    </article>`;
  }

  _routeIdentity(entity) {
    const current = this._state(entity)?.state;
    const fallback = current === "Автовыбор" ? this._state("select.clash_instance_avtovybor")?.state : "";
    return JSON.stringify([current, fallback, this._state(this._config.mode)?.state, this._hass?.connected !== false, this._routeRevisions[entity] || 0]);
  }

  _invalidateChecks(entity) {
    this._routeRevisions[entity] = (this._routeRevisions[entity] || 0) + 1;
    delete this._pings[entity];
    delete this._serviceChecks[entity];
  }

  _currentCheck(entity, checks) {
    const result = checks[entity];
    return result?.identity === this._routeIdentity(entity) ? result : null;
  }

  _groupStatus(entity) {
    const state = this._state(entity);
    if (this._hass?.connected === false || !state || ["unknown", "unavailable"].includes(state.state)) return "Нет связи с HA";
    const service = this._currentCheck(entity, this._serviceChecks);
    const ping = this._currentCheck(entity, this._pings);
    // Completion order is independent of equal timestamps or wall-clock changes.
    if (ping && (!service || ping.sequence > service.sequence)) {
      return ping.error ? "Пинг не прошёл" : `Сервер отвечает · ${this._checkTime(ping)}`;
    }
    if (service) return service.error ? "Проверка сайта не прошла" : `Сайт ответил · ${this._checkTime(service)}`;
    return state.attributes?.alive === false ? "Нет ответа от сервера" : "Управление доступно";
  }

  _checkTime(result) {
    return new Date(result.checkedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  _routingHint() {
    return this._stateValue(this._config.mode) === "rule" ? "Выбор применяется сразу" : "Правила сервисов отключены; общий маршрут задан режимом";
  }

  _errorDetails(entity, kind, result) {
    if (!result?.error) return "";
    const detail = String(result.detail || "Нет измерения задержки").slice(0, 700);
    const reason = /timeout|timed out|504/i.test(detail) ? "Таймаут проверки"
      : /401|403/.test(detail) ? "API сообщил об ошибке доступа"
        : /Нет подтверждённого ответа/.test(detail) ? "Не получено измерение задержки" : "Ошибка проверки";
    const key = `${entity}:${kind}`;
    return `<details class="check-details" data-detail-key="${esc(key)}"${this._detailOpen.has(key) ? " open" : ""}><summary>Подробнее: ${esc(reason)}</summary><p>${esc(detail)}</p><p>Маршрут: ${esc(result.node)} · ${esc(this._checkTime(result))}<br>${esc(result.url)}</p></details>`;
  }

  _pingRow(entity, apiGroup, current) {
    const available = this._hass?.connected !== false && Boolean(this._state(entity)) && !["unknown", "unavailable"].includes(current);
    const pending = this._pendingSelections.has(entity);
    const ping = this._currentCheck(entity, this._pings);
    const pingBusy = Boolean(this._pingBusy[entity]);
    const serviceBusy = Boolean(this._serviceBusy[entity]);
    const pingText = ping ? (ping.error ? ping.text : `${this._formatNumber(ping.value)} ms · ${this._checkTime(ping)}`) : "До Google · ещё не проверен";
    const pingClass = ping?.error ? "is-error" : ping ? (ping.value < 80 ? "is-good" : ping.value < 160 ? "is-ok" : "is-slow") : "";
    const url = this._config.service_urls?.[apiGroup];
    const service = this._currentCheck(entity, this._serviceChecks);
    const ruleMode = this._stateValue(this._config.mode) === "rule";
    const serviceText = !ruleMode ? "Доступно в режиме «По правилам»" : service ? (service.error ? service.text : `Сайт ответил · ${this._formatNumber(service.value)} ms · ${this._checkTime(service)}`) : `${url ? new URL(url).hostname : "Сайт"} · не проверяет вход`;
    return `<div class="diagnostics"><div class="ping-row"><button type="button" class="ping-button" data-ping-entity="${esc(entity)}" data-ping-group="${esc(apiGroup)}"${!available || pending || pingBusy || serviceBusy ? " disabled" : ""}>${pingBusy ? "Проверка…" : "Пинг сервера"}</button><span class="ping-result ${pingClass}" title="Проверка выбранной группы через Google; не проверяет сам сервис">${esc(pingText)}</span>${this._errorDetails(entity, "ping", ping)}</div>${url ? `<div class="ping-row service-row"><button type="button" class="ping-button" data-service-entity="${esc(entity)}" data-service-group="${esc(apiGroup)}"${!available || pending || !ruleMode || pingBusy || serviceBusy ? " disabled" : ""}>${serviceBusy ? "Проверка…" : "Проверить сервис"}</button><span class="ping-result ${service?.error ? "is-error" : service ? "is-good" : ""}" title="${esc(url)} · через выбранную группу; ошибка не доказывает блокировку">${esc(serviceText)}</span>${this._errorDetails(entity, "service", service)}</div>` : ""}</div>`;
  }

  _refreshPingRow(entity, groupName) {
    const card = [...this.querySelectorAll("[data-group-card]")]
      .find((item) => item.dataset.groupCard === entity);
    const row = card?.querySelector(".diagnostics");
    if (row) row.outerHTML = this._pingRow(entity, groupName, this._state(entity)?.state);
    const status = card?.querySelector(".group-status");
    if (status) status.innerHTML = `<i></i>${esc(this._groupStatus(entity))}`;
  }

  async _runCheck(entity, groupName, kind) {
    const serviceCheck = kind === "service";
    const busy = serviceCheck ? this._serviceBusy : this._pingBusy;
    const checks = serviceCheck ? this._serviceChecks : this._pings;
    const current = this._state(entity)?.state;
    const url = serviceCheck ? this._config.service_urls?.[groupName] : this._config.ping_url;
    if (!this._hass || this._hass.connected === false || !current || ["unknown", "unavailable"].includes(current) || !url
      || this._pingBusy[entity] || this._serviceBusy[entity] || this._pendingSelections.has(entity)
      || (serviceCheck && this._stateValue(this._config.mode) !== "rule")) return false;
    const identity = this._routeIdentity(entity);
    busy[entity] = true;
    delete checks[entity];
    this._refreshPingRow(entity, groupName);
    try {
      const result = await this._hass.callWS({
        type: "call_service", domain: "clash_controller", service: "get_latency_service",
        service_data: { device_id: this._config.device_id, node: groupName, url, timeout: this._config.ping_timeout },
        return_response: true,
      });
      const response = result?.response || result?.result?.response || {};
      const latency = response.latency;
      const value = Array.isArray(latency) ? latency.find((row) => Array.isArray(row) && row[0] === groupName)?.[1] : latency?.[groupName];
      if (value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) <= 0) {
        throw new Error("Нет подтверждённого ответа");
      }
      if (this._routeIdentity(entity) !== identity) return false;
      checks[entity] = { identity, node: current, value: Number(value), checkedAt: Date.now(), sequence: this._checkSequence = (this._checkSequence || 0) + 1, url };
      return true;
    } catch (error) {
      if (this._routeIdentity(entity) !== identity) return false;
      checks[entity] = { identity, node: current, error: true, text: serviceCheck ? "Нет подтверждённого ответа сайта" : "Пинг не прошёл", detail: error?.message || "Ошибка проверки", checkedAt: Date.now(), sequence: this._checkSequence = (this._checkSequence || 0) + 1, url };
      return false;
    } finally {
      busy[entity] = false;
      this._refreshPingRow(entity, groupName);
    }
  }

  async _pingGroup(entity, groupName) {
    return this._runCheck(entity, groupName, "ping");
  }

  async _checkService(entity, groupName) {
    return this._runCheck(entity, groupName, "service");
  }

  async _pingOutcome(entity, groupName) {
    const state = this._state(entity);
    if (this._hass?.connected === false || !state || ["unknown", "unavailable"].includes(state.state)) return { status: "skipped", reason: "Нет связи с HA" };
    if (this._pingBusy[entity] || this._serviceBusy[entity]) return { status: "skipped", reason: "Проверка уже идёт" };
    if (this._pendingSelections.has(entity)) return { status: "skipped", reason: "Применяется выбор сервера" };
    if (!this._config.ping_url) return { status: "skipped", reason: "Не задан адрес проверки" };
    const identity = this._routeIdentity(entity);
    const before = this._pings[entity];
    try {
      if (await this._pingGroup(entity, groupName)) return { status: "success" };
      if (this._routeIdentity(entity) !== identity) return { status: "skipped", reason: "Маршрут изменился во время проверки" };
      const result = this._currentCheck(entity, this._pings);
      return result?.error && result !== before ? { status: "error", reason: result.text } : { status: "skipped", reason: "Проверка не выполнялась" };
    } catch (error) {
      return { status: "error", reason: "Ошибка выполнения проверки" };
    }
  }

  _pingSummaryMarkup() {
    const summary = this._pingAllSummary;
    if (!summary) return "";
    const { success, error, skipped } = summary.counts;
    return `<div class="ping-all-summary">Общая проверка · ${esc(this._checkTime(summary))}<br>Успешно: ${success} · ошибок: ${error} · пропущено: ${skipped}${summary.results.some(row => row.status !== "success") ? `<details class="check-details"><summary>Результаты по группам</summary>${summary.results.filter(row => row.status !== "success").map(row => `<p>${esc(row.label)}: ${row.status === "skipped" ? "пропущено" : "ошибка"} — ${esc(row.reason)}</p>`).join("")}</details>` : ""}</div>`;
  }

  _diagnosticGroups() {
    const groups = this._config.groups.map(([key, label, , apiGroup]) => ({
      entity: `select.clash_instance_${key}`, groupName: apiGroup || label, label,
    }));
    if (!groups.some(({ entity }) => entity === this._config.primary)) {
      groups.unshift({ entity: this._config.primary, groupName: this._config.primary_group, label: "Основной сервер" });
    }
    return groups;
  }

  async _pingAll() {
    if (!this._hass || this._pingAllBusy) return;
    this._pingAllBusy = true;
    this._pingAllSummary = null;
    const groups = this._diagnosticGroups();
    const results = new Array(groups.length);
    let nextGroup = 0;
    try {
      this._render();
      const worker = async () => {
        while (nextGroup < groups.length) {
          const index = nextGroup++;
          const { entity, groupName, label } = groups[index];
          results[index] = { label, ...await this._pingOutcome(entity, groupName) };
        }
      };
      await Promise.all(Array.from({ length: Math.min(2, groups.length) }, worker));
      const counts = { success: 0, error: 0, skipped: 0 };
      for (const row of results) counts[row.status] += 1;
      this._pingAllSummary = { counts, results, checkedAt: Date.now() };
    } finally {
      this._pingAllBusy = false;
      this._render();
    }
  }

  _modeButtons() {
    const entity = this._config.mode;
    const state = this._state(entity);
    const current = state?.state;
    const options = state?.attributes?.options || ["rule", "global", "direct"];
    const labels = { rule: "По правилам", global: "Глобальный", direct: "Напрямую" };
    return options
      .map((option) => `<button class="mode-button ${option === current ? "is-selected" : ""}" data-mode-entity="${esc(entity)}" data-mode="${esc(option)}"${this._pendingSelections.has(entity) ? " disabled" : ""}>${esc(labels[option] || option)}</button>`)
      .join("");
  }

  _trafficRows() {
    return this._config.traffic
      .map(([key, label, icon, unit]) => this._metric(`sensor.clash_instance_${key}`, label, icon, unit))
      .join("");
  }

  _updatedAt() {
    const metricDates = this._config.metrics
      .map(([key]) => this._state(`sensor.clash_instance_${key}`))
      .flatMap((state) => [state?.last_reported, state?.last_updated])
      .map((date) => Date.parse(date))
      .filter(Number.isFinite);
    const fallback = this._state(this._config.primary);
    const latest = metricDates.length
      ? Math.max(...metricDates)
      : Date.parse(fallback?.last_reported || fallback?.last_updated);
    if (!Number.isFinite(latest)) return "данные ещё не получены";
    const age = Math.max(0, Math.round((Date.now() - latest) / 1000));
    if (age < 60) return `обновлено ${age} сек назад`;
    return `обновлено ${Math.round(age / 60)} мин назад`;
  }

  _render() {
    if (!this._hass || !this._config) return;
    this.querySelectorAll("details[data-detail-key]").forEach(detail => {
      detail.open ? this._detailOpen.add(detail.dataset.detailKey) : this._detailOpen.delete(detail.dataset.detailKey);
    });
    const openMenuScroll = [...this.querySelectorAll("[data-select-menu]")]
      .find((menu) => menu.dataset.selectMenu === this._openMenuEntity)?.scrollTop || 0;
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
          <div class="brand"><span class="brand-mark">◈</span><div><span class="overline">MIHOMO CONTROL</span><div class="brand-title"><h1>Proxy control</h1>${this._versionBadge()}</div></div></div>
          <div class="top-actions">${this._onlineMarkup()}${this._config.router_url ? '<button class="router-button" data-router="true">Открыть полную панель <span>↗</span></button>' : ""}</div>
        </header>

        <section class="hero ${this._openMenuEntity === this._config.global ? "is-menu-open" : ""}">
          <div class="hero-copy">${this._heroCopy()}</div>
          <div class="mode-panel"><span class="overline">РЕЖИМ РАБОТЫ</span><div class="mode-buttons">${this._modeButtons()}</div></div>
        </section>

        <section class="section"><div class="section-title"><div><span class="overline">LIVE TELEMETRY</span><h3>Состояние подключения</h3></div><span class="updated">${esc(this._updatedAt())}</span></div><div class="metrics">${metricCards}</div></section>

        <section class="section routing-section ${this._openMenuEntity ? "is-menu-open" : ""}"><div class="section-title"><div><span class="overline">ROUTING GROUPS</span><h3>Маршрутизация сервисов</h3></div><span class="section-hint">${esc(this._routingHint())}</span></div><div class="groups">${groupCards}</div></section>

        <section class="bottom-grid"><div class="panel"><div class="panel-title"><span class="panel-icon">↯</span><div><span class="overline">TRAFFIC TOTAL</span><h3>Всего трафика</h3></div></div><div class="traffic">${this._trafficRows()}</div></div><div class="panel"><div class="panel-title"><span class="panel-icon">⚙</span><div><span class="overline">QUICK ACTIONS</span><h3>Быстрые действия</h3></div></div><div class="actions">${actionButtons}</div>${this._pingSummaryMarkup()}</div></section>

        <footer><span>Clash Controller · локальное управление</span><span>API через Home Assistant</span></footer>
        ${this._notice ? `<div class="notice ${this._notice.kind}">${esc(this._notice.text)}</div>` : ""}
      </main>`;
    const openMenu = [...this.querySelectorAll("[data-select-menu]")]
      .find((menu) => menu.dataset.selectMenu === this._openMenuEntity);
    if (openMenu) openMenu.scrollTop = openMenuScroll;
    this._bindEvents();
  }

  _menuFor(entity) {
    return [...this.querySelectorAll("[data-select-menu]")].find(menu => menu.dataset.selectMenu === entity);
  }

  _triggerFor(entity) {
    return [...this.querySelectorAll("[data-select-toggle]")].find(button => button.dataset.selectToggle === entity);
  }

  _closeMenu(restoreFocus = true) {
    const entity = this._openMenuEntity;
    this._openMenuEntity = null;
    this.querySelectorAll("[data-select-toggle]").forEach(button => button.setAttribute("aria-expanded", "false"));
    this.querySelectorAll("[data-select-menu]").forEach(menu => { menu.hidden = true; });
    this.querySelectorAll(".group-card, .routing-section, .hero").forEach(node => node.classList.remove("is-menu-open"));
    if (restoreFocus && entity) this._triggerFor(entity)?.focus();
  }

  _toggleMenu(trigger, keyboard = false) {
    const entity = trigger.dataset.selectToggle;
    const wasOpen = this._openMenuEntity === entity;
    if (wasOpen && !keyboard) { this._closeMenu(); return; }
    if (!wasOpen) this._closeMenu(false);
    const menu = this._menuFor(entity);
    if (!menu || trigger.disabled) return;
    this._openMenuEntity = entity;
    trigger.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    trigger.closest(".group-card")?.classList.add("is-menu-open");
    this.querySelector(".routing-section")?.classList.toggle("is-menu-open", entity !== this._config.global);
    this.querySelector(".hero")?.classList.toggle("is-menu-open", entity === this._config.global);
    if (keyboard) {
      const options = [...menu.querySelectorAll("[data-group-option]")].filter(button => !button.disabled);
      (options.find(button => button.getAttribute("aria-selected") === "true") || options[0])?.focus();
    }
  }

  _handleKeydown(event) {
    if (event.key === "Escape" && this._openMenuEntity) { event.preventDefault(); this._closeMenu(); return; }
    const target = event.target;
    if (target?.hasAttribute?.("data-select-toggle") && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault(); this._toggleMenu(target, true); return;
    }
    const menu = target?.closest?.("[data-select-menu]");
    if (!menu || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const options = [...menu.querySelectorAll("[data-group-option]")].filter(button => !button.disabled);
    if (!options.length) return;
    event.preventDefault();
    const index = options.indexOf(target);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  }

  _bindEvents() {
    if (!this._eventsBound) {
      this.addEventListener("click", event => this._handleClick(event));
      this.addEventListener("keydown", event => this._handleKeydown(event));
      this.addEventListener("focusout", event => {
        const wrap = this._triggerFor(this._openMenuEntity)?.closest(".select-wrap");
        if (wrap && !wrap.contains(event.relatedTarget)) this._closeMenu(false);
      });
      this.addEventListener("toggle", event => {
        const key = event.target?.dataset?.detailKey;
        if (key) event.target.open ? this._detailOpen.add(key) : this._detailOpen.delete(key);
      }, true);
      this._eventsBound = true;
    }
    if (this.isConnected && !this._outsideListener) {
      this._outsideListener = event => {
        const wrap = this._triggerFor(this._openMenuEntity)?.closest(".select-wrap");
        if (wrap && !event.composedPath().includes(wrap) && !wrap.contains(event.target)) this._closeMenu(false);
      };
      this.ownerDocument.addEventListener("pointerdown", this._outsideListener);
    }
  }

  _handleClick(event) {
    const target = event.target?.closest?.("button");
    if (!target) { if (!event.target?.closest?.(".select-wrap")) this._closeMenu(false); return; }
    if (target.disabled) return;
    if (target.hasAttribute("data-select-toggle")) {
      this._toggleMenu(target);
    } else if (target.hasAttribute("data-group-option")) {
      const entityId = target.dataset.groupEntity;
      const option = target.dataset.groupOption;
      if (option !== this._state(entityId)?.state) this._invalidateChecks(entityId);
      this._closeMenu();
      delete this._pings[entityId];
      void this._call("select", "select_option", { entity_id: entityId, option }, `Маршрут изменён: ${option}`);
    } else if (target.hasAttribute("data-service-entity")) {
      void this._checkService(target.dataset.serviceEntity, target.dataset.serviceGroup);
    } else if (target.hasAttribute("data-ping-entity")) {
      void this._pingGroup(target.dataset.pingEntity, target.dataset.pingGroup);
    } else if (target.hasAttribute("data-ping-all")) {
      void this._pingAll();
    } else if (target.hasAttribute("data-mode-entity")) {
      if (target.dataset.mode !== this._state(target.dataset.modeEntity)?.state) {
        for (const [key] of this._config.groups) this._invalidateChecks(`select.clash_instance_${key}`);
      }
      void this._call("select", "select_option", { entity_id: target.dataset.modeEntity, option: target.dataset.mode }, `Режим: ${target.dataset.mode}`);
    } else if (target.hasAttribute("data-action-entity")) {
      void this._call("button", "press", { entity_id: target.dataset.actionEntity }, "Команда отправлена");
    } else if (target.hasAttribute("data-router")) {
      window.open(this._config.router_url, "_blank", "noopener");
    }
  }

  async _call(domain, service, data, successText) {
    if (!this._hass) return;
    const selectionEntity = domain === "select" && service === "select_option" ? data.entity_id : null;
    if (selectionEntity && this._pendingSelections.has(selectionEntity)) return;
    if (selectionEntity) {
      this._pendingSelections.add(selectionEntity);
      this.querySelectorAll("button[data-select-toggle], button[data-mode-entity]").forEach((button) => {
        if (button.dataset.selectToggle === selectionEntity || button.dataset.modeEntity === selectionEntity) button.disabled = true;
      });
    }
    try {
      await this._hass.callService(domain, service, data);
      this._notice = { kind: "success", text: successText };
    } catch (error) {
      this._notice = { kind: "error", text: `Ошибка: ${error?.message || "команда не выполнена"}` };
    } finally {
      if (selectionEntity) this._pendingSelections.delete(selectionEntity);
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
    .brand { display:flex; align-items:center; gap:13px; }.brand-title { display:flex; align-items:baseline; flex-wrap:wrap; gap:8px; }.version-badge { display:inline-flex; align-items:center; padding:3px 7px; border:1px solid rgba(129,169,255,.35); border-radius:999px; color:#a9c6ff; background:rgba(107,149,255,.1); font-size:10px; font-weight:700; line-height:1.2; letter-spacing:.04em; }.version-badge.is-unavailable { border-color:rgba(246,191,88,.35); color:#f6bf58; background:rgba(246,191,88,.08); }.brand-mark { display:grid; place-items:center; width:40px; height:40px; border:1px solid rgba(129,169,255,.55); border-radius:13px; color:#a9c6ff; background:linear-gradient(145deg,rgba(107,149,255,.28),rgba(154,106,255,.12)); font-size:22px; box-shadow:0 0 28px rgba(85,126,255,.2); }.overline { display:block; color:#7686a4; font-size:10px; font-weight:750; letter-spacing:.16em; text-transform:uppercase; }h1,h2,h3,p { margin:0; }h1 { margin-top:3px; font-size:18px; font-weight:650; letter-spacing:-.02em; }.top-actions { display:flex; align-items:center; gap:12px; }.online { color:#a7b4c9; font-size:12px; white-space:nowrap; }.online i,.group-status i { display:inline-block; width:7px; height:7px; margin-right:6px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 4px rgba(82,223,174,.1),0 0 13px rgba(82,223,174,.7); }.router-button,.action-button,.mode-button { border:1px solid var(--line); color:#bac8df; background:rgba(255,255,255,.045); cursor:pointer; transition:.2s ease; }.router-button { padding:10px 13px; border-radius:11px; font-size:12px; }.router-button:hover,.action-button:hover,.mode-button:hover { border-color:rgba(130,171,255,.62); color:#fff; background:rgba(108,150,255,.13); transform:translateY(-1px); }
    .hero.is-menu-open { z-index:20; }.global-selector { margin-top:16px; max-width:460px; }.check-details { width:100%; color:#aebbd1; font-size:11px; line-height:1.5; }.check-details summary { cursor:pointer; color:#a9c6ff; }.check-details p { margin-top:5px; overflow-wrap:anywhere; }.ping-all-summary { margin-top:12px; color:#aebbd1; font-size:11px; }
    .hero { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr); gap:25px; align-items:end; padding:30px; margin-bottom:31px; border:1px solid rgba(143,174,235,.2); border-radius:22px; background:linear-gradient(115deg,rgba(34,49,80,.8),rgba(20,28,50,.65)); }.hero-copy h2 { margin-top:8px; overflow:hidden; color:#fff; font-size:clamp(29px,4vw,50px); font-weight:650; letter-spacing:-.055em; text-overflow:ellipsis; white-space:nowrap; }.hero-copy p { margin-top:11px; color:#8f9db6; font-size:12px; }.hero-copy p b { color:#d6e1f4; font-weight:600; }.mode-panel { padding:17px; border:1px solid rgba(143,174,235,.14); border-radius:16px; background:rgba(4,10,24,.3); }.mode-buttons { display:flex; gap:7px; margin-top:11px; }.mode-button { flex:1; min-height:38px; border-radius:9px; font-size:11px; }.mode-button.is-selected { border-color:rgba(128,172,255,.8); color:#fff; background:linear-gradient(135deg,rgba(96,143,255,.35),rgba(152,103,255,.28)); box-shadow:inset 0 0 20px rgba(112,157,255,.12),0 5px 18px rgba(79,118,244,.14); }
    .section { margin-bottom:31px; }.section-title { display:flex; justify-content:space-between; align-items:end; gap:15px; margin-bottom:14px; }.section-title h3,.panel-title h3 { margin-top:4px; color:#dfe8f8; font-size:16px; font-weight:600; letter-spacing:-.02em; }.updated,.section-hint { color:#74839e; font-size:11px; }.metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }.metric { display:flex; align-items:center; gap:12px; min-height:73px; padding:14px; border:1px solid var(--line); border-radius:15px; background:var(--panel); }.metric-icon { display:grid; place-items:center; flex:none; width:31px; height:31px; border-radius:9px; color:#91b6ff; background:rgba(108,153,255,.13); font-size:18px; }.metric-copy { min-width:0; }.metric-copy span { display:block; overflow:hidden; color:#7f8da7; font-size:11px; text-overflow:ellipsis; white-space:nowrap; }.metric-copy strong { display:block; margin-top:4px; color:#e7efff; font-size:18px; font-weight:650; }.metric-copy small { margin-left:3px; color:#7889a6; font-size:10px; font-weight:500; }
    .groups { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }.group-card { min-width:0; padding:16px; border:1px solid var(--line); border-radius:16px; background:var(--panel); transition:.2s ease; }.group-card:hover { border-color:rgba(130,171,255,.42); background:rgba(28,40,67,.85); transform:translateY(-2px); }.group-card.is-down { border-color:rgba(255,111,141,.35); }.group-head { display:flex; align-items:center; min-width:0; gap:10px; }.group-icon { display:grid; place-items:center; flex:none; width:31px; height:31px; border-radius:9px; color:#a5c3ff; background:linear-gradient(145deg,rgba(114,161,255,.2),rgba(159,123,255,.14)); font-size:15px; }.group-head b { display:block; overflow:hidden; color:#d9e4f7; font-size:13px; font-weight:600; text-overflow:ellipsis; white-space:nowrap; }.group-status { display:block; margin-top:4px; color:#70809c; font-size:10px; }.group-delay { margin-left:auto; color:#8394b2; font-size:10px; white-space:nowrap; }.group-current { overflow:hidden; margin:16px 0 13px; color:#f0f5ff; font-size:15px; font-weight:600; text-overflow:ellipsis; white-space:nowrap; }.node-label { display:inline-flex; align-items:center; min-width:0; gap:8px; }.node-label > span:last-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.hero-node { gap:12px; }.country-flag-svg { display:inline-block; flex:none; width:1.45em; height:1em; overflow:hidden; border:1px solid rgba(255,255,255,.28); border-radius:2px; box-shadow:0 1px 4px rgba(0,0,0,.28); vertical-align:-.12em; }.country-flag { display:inline-block; flex:none; width:1.3em; height:.86em; border:1px solid rgba(255,255,255,.25); border-radius:2px; background:#71819e; box-shadow:0 1px 4px rgba(0,0,0,.25); }.flag-ru { background:linear-gradient(to bottom,#fff 0 33%,#1d4ed8 33% 66%,#ef4444 66%); }.flag-it { background:linear-gradient(to right,#169b62 0 33%,#fff 33% 66%,#ce2b37 66%); }.flag-gb { background:linear-gradient(to right,transparent 42%,#fff 42% 58%,transparent 58%),linear-gradient(to bottom,transparent 42%,#fff 42% 58%,transparent 58%),linear-gradient(to right,transparent 46%,#cf142b 46% 54%,transparent 54%),linear-gradient(to bottom,transparent 46%,#cf142b 46% 54%,transparent 54%),#012169; }.flag-nl { background:linear-gradient(to bottom,#ae1c28 0 33%,#fff 33% 66%,#21468b 66%); }.flag-ee { background:linear-gradient(to bottom,#0072ce 0 33%,#000 33% 66%,#fff 66%); }.flag-se { background:linear-gradient(to right,transparent 35%,#fecc00 35% 48%,transparent 48%),linear-gradient(to bottom,transparent 42%,#fecc00 42% 58%,transparent 58%),#006aa7; }.flag-de { background:linear-gradient(to bottom,#000 0 33%,#dd0000 33% 66%,#ffce00 66%); }.flag-tr { background:radial-gradient(circle at 38% 50%,#fff 0 27%,transparent 28%),radial-gradient(circle at 46% 50%,#e30a17 0 21%,transparent 22%),#e30a17; }.flag-us { background:linear-gradient(#3c3b6e 0 55%,transparent 55%) 0 0/52% 55% no-repeat,repeating-linear-gradient(to bottom,#b22234 0 14%,#fff 14% 28%); }.flag-jp { background:radial-gradient(circle at center,#bc002d 0 32%,transparent 34%),#fff; }.select-wrap { position:relative; display:block; z-index:2; }.select-wrap > span:first-child { display:block; margin-bottom:5px; color:#6e7e9b; font-size:10px; }.node-select-trigger { position:relative; display:flex; align-items:center; width:100%; min-height:34px; padding:0 28px 0 9px; border:1px solid rgba(141,171,224,.18); border-radius:8px; outline:none; color:#aebbd1; background:#121c31; cursor:pointer; text-align:left; font:inherit; font-size:11px; }.node-select-trigger:focus { border-color:var(--accent); }.node-select-trigger em { position:absolute; right:10px; color:#7e92b5; pointer-events:none; font-style:normal; }.node-options { position:absolute; top:calc(100% + 5px); right:0; left:0; z-index:5; max-height:230px; overflow-y:auto; padding:5px; border:1px solid rgba(141,171,224,.24); border-radius:10px; background:#121c31; box-shadow:0 14px 30px rgba(0,0,0,.38); }.node-option { display:flex; align-items:center; width:100%; min-height:31px; padding:6px 7px; border:0; border-radius:6px; color:#aebbd1; background:transparent; cursor:pointer; text-align:left; font:inherit; font-size:11px; }.node-option:hover,.node-option.is-selected { color:#fff; background:rgba(108,150,255,.18); }.group-card:focus-within,.select-wrap:focus-within { position:relative; z-index:10; }.ping-row { display:flex; align-items:center; gap:8px; min-width:0; margin-top:12px; }.ping-button { display:inline-flex; align-items:center; gap:5px; flex:none; min-height:29px; padding:0 9px; border:1px solid rgba(112,167,255,.32); border-radius:8px; color:#b9d0ff; background:rgba(112,167,255,.1); cursor:pointer; font:inherit; font-size:10px; font-weight:700; letter-spacing:.07em; transition:.2s ease; }.ping-button:hover { border-color:rgba(130,171,255,.8); color:#fff; background:rgba(108,150,255,.22); transform:translateY(-1px); }.ping-button:disabled { cursor:wait; opacity:.7; transform:none; }.ping-button span { color:#86b0ff; font-size:14px; line-height:1; }.ping-button .ping-spinner { width:12px; height:12px; border:2px solid rgba(134,176,255,.3); border-top-color:#fff; border-radius:50%; animation:ping-spin .8s linear infinite; }.ping-row { flex-wrap:wrap; }.ping-result { max-width:100%; overflow:hidden; color:#7888a4; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.ping-result.is-good { color:var(--ok); }.ping-result.is-ok { color:#f3ca72; }.ping-result.is-slow,.ping-result.is-error { color:var(--danger); }.ping-fastest { overflow:hidden; margin-left:auto; color:#6f80a0; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }@keyframes ping-spin { to { transform:rotate(360deg); } }
    .bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }.panel { padding:18px; border:1px solid var(--line); border-radius:16px; background:var(--panel); }.panel-title { display:flex; align-items:center; gap:10px; margin-bottom:17px; }.panel-icon { display:grid; place-items:center; width:31px; height:31px; border-radius:9px; color:#b99fff; background:rgba(159,123,255,.15); }.traffic { display:grid; grid-template-columns:1fr 1fr; gap:9px; }.traffic .metric { min-height:58px; padding:10px; background:rgba(255,255,255,.025); }.traffic .metric-icon { width:26px; height:26px; font-size:15px; }.traffic .metric-copy strong { font-size:15px; }.actions { display:flex; flex-wrap:wrap; gap:9px; }.action-button { display:flex; align-items:center; gap:8px; min-height:39px; padding:0 12px; border-radius:9px; font-size:11px; }.action-button span { color:#96b8ff; font-size:16px; }.action-button .ping-spinner { width:13px; height:13px; border:2px solid rgba(150,184,255,.3); border-top-color:#fff; border-radius:50%; animation:ping-spin .8s linear infinite; }footer { display:flex; justify-content:space-between; gap:10px; margin-top:25px; padding-top:15px; border-top:1px solid var(--line); color:#64738e; font-size:10px; }.notice { position:absolute; z-index:3; right:24px; bottom:20px; padding:10px 14px; border:1px solid rgba(82,223,174,.4); border-radius:10px; color:#ccffed; background:#12352f; box-shadow:0 10px 30px rgba(0,0,0,.3); font-size:12px; }.notice.error { border-color:rgba(255,111,141,.5); color:#ffd5de; background:#3e1725; }
    .routing-section.is-menu-open { z-index:20; }
    .node-select-trigger:disabled,.mode-button:disabled { cursor:wait; opacity:.58; transform:none; }
    .online.is-offline i { background:var(--danger); box-shadow:0 0 0 4px rgba(255,111,141,.1),0 0 13px rgba(255,111,141,.55); }
    .group-card.is-menu-open,.group-card.is-menu-open:hover { position:relative; z-index:30; transform:none; }
    .node-options { max-height:min(230px,45vh); overscroll-behavior:contain; -webkit-overflow-scrolling:touch; }
    @media (max-width:820px) { .shell { padding:18px; border-radius:20px; }.topbar,.section-title,footer { align-items:flex-start; flex-direction:column; }.top-actions { width:100%; justify-content:space-between; }.hero { grid-template-columns:1fr; padding:21px; }.metrics { grid-template-columns:repeat(2,1fr); }.groups { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:540px) { .metrics,.groups,.bottom-grid { grid-template-columns:1fr; }.mode-buttons { flex-direction:column; }.mode-button { min-height:34px; }.hero-copy h2 { font-size:32px; }.router-button { padding:9px 10px; }.online { font-size:11px; }.node-option { min-height:40px; }.node-options { max-height:min(240px,50vh); } }
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

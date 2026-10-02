  /* ================================================================== */
  /* MY BASIL: the tasks in the phone's own calendar                     */
  /* ================================================================== */
  // a file of events (.ics) for the next weeks, or one task straight into Google Calendar; no server needed.
  // Events stand at 9:00 local time with a reminder; a task's UID stays the same, so a calendar that is given
  // the file again updates the events instead of doubling them
  const ICS_WEEKS = 8;
  // how often a repeating task comes back, as the task engine counts it (data: B.GARDEN.repeat)
  function repeatEvery(p, key) {
    const R = B.GARDEN.repeat;
    if (key === 'feed') return R.feed.every[p.place || 'home'] || 10;
    return R[key] && R[key].every ? R[key].every : 0;
  }
  // each task of a bush from today to the end of the span: one-time steps on their first open day,
  // repeating ones again and again
  function plantEvents(p, day, weeks = ICS_WEEKS) {
    const end = addDays(day, weeks * 7), out = [];
    plantTasks(p, day).forEach(t => {
      if (!['late', 'now', 'soon'].includes(t.state)) return;
      if (t.repeat) {
        const every = repeatEvery(p, t.key);
        for (let d = t.due < day ? day : t.due; d <= end; d = addDays(d, every || 1)) {
          // the buds come only in summer months
          if (t.key === 'buds' && !B.GARDEN.repeat.buds.months.includes(d.getMonth())) continue;
          out.push({ p, t, d });
          if (!every) break;
        }
      } else {
        const d = t.from < day ? day : t.from;
        if (d <= end) out.push({ p, t, d });
      }
    });
    return out;
  }
  const icsDate = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const icsText = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  // lines are folded at 75 bytes, never inside a letter (Cyrillic takes two)
  function icsFold(line) {
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 75) return line;
    const parts = [];
    let cur = '', n = 0;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (n + b > (parts.length ? 74 : 75)) { parts.push(cur); cur = ''; n = 0; }
      cur += ch;
      n += b;
    }
    parts.push(cur);
    return parts.join('\r\n ');
  }
  const guideUrl = link => { try { return new URL(urlFor('#' + link), location.href).href; } catch (e) { return ''; } };
  const eventTitle = (p, t) => `Базилик «${p.name}»: ${t.title.charAt(0).toLowerCase() + t.title.slice(1)}`;
  function gardenIcs(plants, day = today()) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ocimum.ru//Мой базилик//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Мой базилик'];
    plants.flatMap(p => plantEvents(p, day)).forEach(({ p, t, d }) => {
      const url = guideUrl(t.link);
      lines.push('BEGIN:VEVENT',
        `UID:${p.id}-${t.key}-${icsDate(d)}@ocimum.ru`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsDate(d)}T090000`,
        `DTEND:${icsDate(d)}T091500`,
        `SUMMARY:${icsText(eventTitle(p, t))}`,
        `DESCRIPTION:${icsText(t.text + (t.once && t.to > d ? `\nМожно до ${fd(t.to)}.` : '') + (url ? '\nКак: ' + url : ''))}`);
      if (url) lines.push(`URL:${url}`);
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(eventTitle(p, t))}`, 'TRIGGER:-PT0M', 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(icsFold).join('\r\n') + '\r\n';
  }
  function exportIcs(plants) {
    const n = plants.flatMap(p => plantEvents(p, today())).length;
    if (!n) { toast('В ближайшие недели дел по плану нет'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([gardenIcs(plants)], { type: 'text/calendar;charset=utf-8' }));
    a.download = plants.length === 1 ? `bazilik-${plants[0].id}.ics` : 'moy-bazilik.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast(`${n} ${plural(n, 'дело', 'дела', 'дел')} на ${ICS_WEEKS} недель — откройте файл, и телефон предложит добавить их в календарь`);
  }
  // one task into Google Calendar: the address opens its «new event» form filled in
  function googleLink(p, t, d) {
    const day = icsDate(d), url = guideUrl(t.link);
    const q = new URLSearchParams({ action: 'TEMPLATE', text: eventTitle(p, t), dates: `${day}T090000/${day}T091500`, details: t.text + (url ? '\n\nКак: ' + url : '') });
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }

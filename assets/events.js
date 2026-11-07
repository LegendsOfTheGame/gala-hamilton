// Shows events from assets/events.json. To add an event, add one entry:
// { "title": "", "date": "YYYY-MM-DD", "time": "", "location": "", "details": "", "partner": "" }
//
// Past events stay under "Recent events" for 30 days, then drop off.
// BIA-sponsored events: add "biaSponsored": true. These stay until Nadine says to
// remove them. To remove one, delete its entry from assets/events.json.
(function () {
  const RECENT_DAYS = 30;
  const slots = document.querySelectorAll("[data-events]");
  const recentBox = document.querySelector("[data-recent]");
  if (!slots.length && !recentBox) return;

  const emptyHtml = '<p class="empty">No events are posted yet. <a href="get-involved.html#share">Tell us about one.</a></p>';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function isRecent(ev) {
    if (ev.biaSponsored === true) return true;
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
    return new Date(ev.date + "T12:00:00") >= cutoff;
  }

  function eventNode(ev, past) {
    const when = new Date(ev.date + "T12:00:00");
    const article = document.createElement("article");
    article.className = past ? "event event-past" : "event";

    const date = document.createElement("div");
    date.className = "event-date";
    date.append(when.toLocaleDateString("en-CA", { month: "short" }));
    const day = document.createElement("b");
    day.textContent = when.getDate();
    date.append(day);
    date.append(String(when.getFullYear()));

    const body = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = ev.title;
    body.append(title);
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = [ev.time, ev.location].filter(Boolean).join(" · ");
    body.append(meta);
    if (ev.details) {
      const details = document.createElement("p");
      details.textContent = ev.details;
      body.append(details);
    }
    if (ev.partner) {
      const partner = document.createElement("p");
      partner.className = "meta";
      partner.textContent = "With " + ev.partner;
      body.append(partner);
    }
    article.append(date, body);
    return article;
  }

  fetch("assets/events.json")
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])
    .then((events) => {
      const valid = events.filter((ev) => ev.title && !Number.isNaN(Date.parse(ev.date)));
      const upcoming = valid
        .filter((ev) => new Date(ev.date + "T23:59:59") >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
      const recent = valid
        .filter((ev) => new Date(ev.date + "T23:59:59") < today && isRecent(ev))
        .sort((a, b) => b.date.localeCompare(a.date));

      if (recentBox && recent.length) {
        const list = document.createElement("div");
        list.className = "event-list";
        recent.forEach((ev) => list.append(eventNode(ev, true)));
        recentBox.append(list);
        recentBox.hidden = false;
      }

      slots.forEach((slot) => {
        const limit = Number(slot.dataset.limit) || upcoming.length;
        const shown = upcoming.slice(0, limit);
        if (!shown.length) {
          slot.innerHTML = emptyHtml;
          return;
        }
        const list = document.createElement("div");
        list.className = "event-list";
        shown.forEach((ev) => list.append(eventNode(ev)));
        slot.replaceChildren(list);
      });
    });
})();

// Shows events from assets/events.json. To add an event, add one entry:
// { "title": "", "date": "YYYY-MM-DD", "time": "", "location": "", "details": "", "partner": "" }
// Optional: "link" (the organizer's post or page) and "map" (a map link for the location).
// Optional: "nearby": true for an event outside the GALA area but inside Ward 2 or Ward 3.
// These show under "Nearby events" on the Events page, not in the main list or on Home.
// Optional: "register": the exact option text from the registration form's "Register for"
// question, for example "Winter Celebration 2026". The event then gets a Register button
// that opens the form with that event already chosen.
//
// Past events stay under "Recent events" for 30 days, then drop off.
// BIA-sponsored events: add "biaSponsored": true. These stay until Nadine says to
// remove them. To remove one, delete its entry from assets/events.json.
(function () {
  const RECENT_DAYS = 30;
  // Evergreen registration form, and the field ID of its "Register for" question.
  const REG_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSfVvCS6oZvht-urzfHds3RgklDD7eL1VYrMVTVUljRvj7OFgw/viewform";
  const REG_FIELD = "entry.1020001099";
  const slots = document.querySelectorAll("[data-events]");
  const recentBox = document.querySelector("[data-recent]");
  // The Projects page lists upcoming BIA-sponsored events inside its events card.
  const biaBox = document.querySelector("[data-bia-events]");
  const nearbyBox = document.querySelector("[data-nearby]");
  if (!slots.length && !recentBox && !biaBox && !nearbyBox) return;

  function link(href, text) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    a.rel = "noopener";
    return a;
  }

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
    if (ev.time) meta.append(ev.time);
    if (ev.time && ev.location) meta.append(" · ");
    if (ev.location) meta.append(ev.map ? link(ev.map, ev.location) : ev.location);
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
    if (ev.link) {
      const more = document.createElement("p");
      more.append(link(ev.link, "More details from the organizer"));
      body.append(more);
    }
    // Past events never show the button.
    if (ev.register && !past) {
      const reg = document.createElement("p");
      const params = new URLSearchParams({ usp: "pp_url", [REG_FIELD]: ev.register });
      const button = link(REG_FORM + "?" + params, "Register");
      button.className = "button-register";
      reg.append(button);
      body.append(reg);
    }
    article.append(date, body);
    return article;
  }

  // "no-cache" makes the browser ask the server for a newer file each time, so a new
  // event shows on the next visit instead of after the browser's saved copy expires.
  fetch("assets/events.json", { cache: "no-cache" })
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

      const bia = upcoming.filter((ev) => ev.biaSponsored === true);
      if (biaBox && bia.length) {
        const list = biaBox.querySelector("ul");
        bia.forEach((ev) => {
          const when = new Date(ev.date + "T12:00:00").toLocaleDateString("en-CA", {
            month: "long", day: "numeric", year: "numeric",
          });
          const li = document.createElement("li");
          li.append(ev.link ? link(ev.link, ev.title) : ev.title, ", " + when);
          list.append(li);
        });
        biaBox.hidden = false;
      }

      if (recentBox && recent.length) {
        const list = document.createElement("div");
        list.className = "event-list";
        recent.forEach((ev) => list.append(eventNode(ev, true)));
        recentBox.append(list);
        recentBox.hidden = false;
      }

      // Nearby events (Wards 2 and 3, outside the GALA area) get their own sub-section.
      const nearby = upcoming.filter((ev) => ev.nearby === true);
      const local = upcoming.filter((ev) => ev.nearby !== true);
      if (nearbyBox && nearby.length) {
        const list = document.createElement("div");
        list.className = "event-list";
        nearby.forEach((ev) => list.append(eventNode(ev)));
        nearbyBox.append(list);
        nearbyBox.hidden = false;
      }

      slots.forEach((slot) => {
        const limit = Number(slot.dataset.limit) || local.length;
        const shown = local.slice(0, limit);
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

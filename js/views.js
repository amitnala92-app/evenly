import {
  daysUntil,
  dueStatus,
  esc,
  formatDay,
  formatStamp,
  initials,
  money,
  moneyPlain,
} from "./util.js";
import { creditScore, friendSummaries, reportableDebts, scoreBand, totalsFor } from "./balances.js";
import { dueTimeline } from "./notify.js";

const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>`,
  groups: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="16" cy="9" r="2.4"/><path d="M4 19c.8-3 2.8-4.5 5-4.5s4.2 1.5 5 4.5M14 14.6c1.7-.2 3.6.8 4.6 3.4"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h4l2.5-6 4 12 2-6h3.5"/></svg>`,
  credit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 4.5 6.5v5.4c0 4.4 3.2 8.3 7.5 9.1 4.3-.8 7.5-4.7 7.5-9.1V6.5z"/><path d="m9 12 2 2 4-4"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21h4"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m14 6-6 6 6 6"/></svg>`,
};

export function renderApp(state, route, ui) {
  const me = state.users.find((user) => user.id === state.sessionUserId);
  if (!me) return viewSplash();
  if (route.name === "splash") route = { name: "home" };

  const body = chooseView(state, me, route, ui);
  const showTabs = !["settle", "report", "add"].includes(route.name);
  return `
    <div class="app">
      ${body}
      ${showTabs ? tabs(route.name) : ""}
      ${ui.toast ? `<div class="toast">${esc(ui.toast)}</div>` : ""}
      ${ui.checkout ? checkoutSheet(state, me, ui.checkout) : ""}
    </div>
  `;
}

function chooseView(state, me, route, ui) {
  switch (route.name) {
    case "friend":
      return viewFriend(state, me, route.id);
    case "groups":
      return viewGroups(state, me);
    case "group":
      return viewGroup(state, me, route.id);
    case "add":
      return viewAdd(state, me, route);
    case "settle":
      return viewSettle(state, me, route.id, ui);
    case "activity":
      return viewActivity(state);
    case "credit":
      return viewCredit(state, me);
    case "report":
      return viewReport(state, me, route.id);
    case "alerts":
      return viewAlerts(state);
    case "profile":
      return viewProfile(state, me);
    default:
      return viewHome(state, me);
  }
}

function viewSplash() {
  return `
    <div class="app">
      <section class="screen splash">
        <div class="splash-card">
          <div class="logo" aria-hidden="true"><div><span></span><span></span></div></div>
          <h1 class="brand">Evenly</h1>
          <p class="lede">Split bills, IOUs, and shared expenses — then <em>set a date</em>, pay by card, and keep credit honest.</p>
          <button class="btn btn-primary" data-action="start">Get started — free</button>
          <button class="btn btn-ghost" data-action="start">Continue to the app</button>
        </div>
      </section>
    </div>
  `;
}

function viewHome(state, me) {
  const { youOwe, youAreOwed, net, rows } = totalsFor(me.id, state.users, state.expenses, state.settlements);
  const unread = state.notifications.filter((item) => !item.read).length;
  return `
    ${topbar("Evenly", unread)}
    <section class="screen">
      <div class="pad">
        <article class="hero-balance">
          <p>Total balance</p>
          <strong>${net >= 0 ? money(net) : `−${moneyPlain(net)}`}</strong>
          <div class="split-stats">
            <div class="stat"><span>You owe</span><b>${money(youOwe)}</b></div>
            <div class="stat"><span>You are owed</span><b>${money(youAreOwed)}</b></div>
          </div>
        </article>
        <div class="section-title"><span>Friends</span><span>Free forever</span></div>
        <div class="list">
          ${rows
            .map((row) => {
              const status = statusChip(row);
              const amount = row.net === 0
                ? `<span class="amt">settled up</span>`
                : row.net > 0
                  ? `<span class="amt good">owes ${money(row.net)}</span>`
                  : `<span class="amt bad">you owe ${moneyPlain(row.net)}</span>`;
              return `
                <button class="row" data-go="#/friend/${row.user.id}">
                  ${avatar(row.user)}
                  <div class="meta">
                    <b>${esc(row.user.name)}</b>
                    <span>${status}</span>
                  </div>
                  ${amount}
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function viewFriend(state, me, id) {
  const user = state.users.find((item) => item.id === id);
  if (!user) return viewHome(state, me);
  const rows = friendSummaries(me.id, state.users, state.expenses, state.settlements);
  const row = rows.find((item) => item.user.id === id);
  const related = state.expenses.filter(
    (expense) => expense.participantIds.includes(me.id) && expense.participantIds.includes(id)
  );
  const open = [...(row?.openFromYou || []), ...(row?.openToYou || [])];
  const due = open.map((item) => item.expense.dueDate).filter(Boolean).sort()[0];
  const canReport = reportableDebts(me.id, id, state.expenses, state.settlements, state.reports).length > 0;
  const youOweThem = (row?.youOwe || 0) > 0;
  const theyOweYou = (row?.theyOwe || 0) > 0;
  return `
    <div class="topbar">
      <button class="back" data-go="#/home">${ICONS.back} Friends</button>
      <button class="icon-btn" data-go="#/alerts">${ICONS.bell}</button>
    </div>
    <section class="screen">
      <div class="pad">
        <div class="person-head">
          ${avatar(user, 56)}
          <div>
            <h2>${esc(user.name)}</h2>
            <p>${row?.net > 0 ? `Owes you ${money(row.net)}` : row?.net < 0 ? `You owe ${moneyPlain(row.net)}` : "Settled up"}</p>
          </div>
        </div>
        ${due ? timelineCard(due, open[0]?.expense.createdAt) : ""}
        <div class="btn-row" style="margin-bottom:16px">
          ${youOweThem ? `<button class="btn btn-primary" data-go="#/settle/${id}">Settle up</button>` : `<button class="btn btn-primary" data-go="#/add?friend=${id}">Add expense</button>`}
          ${canReport ? `<button class="btn btn-danger" data-go="#/report/${id}">Report to credit</button>` : theyOweYou ? `<button class="btn btn-ghost" disabled>Report after due date</button>` : ""}
        </div>
        <div class="section-title"><span>Shared expenses</span></div>
        <div class="list">
          ${related
            .map((expense) => expenseRow(expense, me, state))
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function viewGroups(state, me) {
  return `
    ${topbar("Groups")}
    <section class="screen">
      <div class="pad">
        <div class="list">
          ${state.groups
            .filter((group) => group.memberIds.includes(me.id))
            .map((group) => {
              const members = group.memberIds.map((id) => state.users.find((user) => user.id === id)?.name.split(" ")[0]).join(", ");
              return `
                <button class="row" data-go="#/group/${group.id}">
                  <div class="avatar" style="background:${group.type === "home" ? "#3d5a45" : group.type === "trip" ? "#2c5f8a" : "#7a4b2a"}">${esc(group.name[0])}</div>
                  <div class="meta"><b>${esc(group.name)}</b><span>${esc(members)} · ${groupIcon(group.type)}</span></div>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function viewGroup(state, me, id) {
  const group = state.groups.find((item) => item.id === id);
  if (!group) return viewGroups(state, me);
  const expenses = state.expenses.filter((expense) => expense.groupId === id);
  return `
    <div class="topbar">
      <button class="back" data-go="#/groups">${ICONS.back} Groups</button>
      <button class="btn btn-primary" style="width:auto;padding:8px 14px" data-go="#/add?group=${id}">Add</button>
    </div>
    <section class="screen">
      <div class="pad">
        <div class="group-cover ${group.type}">${groupIcon(group.type)}</div>
        <h2 style="margin:0 0 4px;letter-spacing:-0.04em">${esc(group.name)}</h2>
        <p class="hint">${group.memberIds.length} people · repayment dates on every split</p>
        <div class="list">
          ${expenses.map((expense) => expenseRow(expense, me, state)).join("")}
        </div>
      </div>
    </section>
  `;
}

function viewAdd(state, me, route) {
  const presetFriend = route.friend;
  const presetGroup = state.groups.find((group) => group.id === route.group);
  const pool = presetGroup
    ? state.users.filter((user) => presetGroup.memberIds.includes(user.id))
    : state.users;
  return `
    <div class="topbar">
      <button class="back" data-go="#/home">${ICONS.back} Cancel</button>
      <b>New split</b>
      <span></span>
    </div>
    <section class="screen">
      <div class="pad">
        <form class="form" data-form="expense">
          <div>
            <label>Description</label>
            <input class="field" name="description" placeholder="Dinner, rent, tickets…" required />
          </div>
          <div>
            <label>Amount</label>
            <input class="field" name="amount" inputmode="decimal" placeholder="0.00" required />
          </div>
          <div>
            <label>Paid by</label>
            <select name="paidById">${pool.map((user) => `<option value="${user.id}" ${user.id === me.id ? "selected" : ""}>${esc(user.name)}</option>`).join("")}</select>
          </div>
          <div>
            <label>Split with</label>
            <div class="people">
              ${pool
                .map((user) => {
                  const on = !presetFriend || user.id === me.id || user.id === presetFriend;
                  return `<button type="button" class="person-toggle ${on ? "on" : ""}" data-toggle-user="${user.id}">${avatar(user, 28)} ${esc(user.name.split(" ")[0])}</button>`;
                })
                .join("")}
            </div>
          </div>
          <div>
            <label>Group</label>
            <select name="groupId">
              <option value="">No group</option>
              ${state.groups.map((group) => `<option value="${group.id}" ${group.id === route.group ? "selected" : ""}>${esc(group.name)}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Repayment timeline</label>
            <div class="chips" data-due-chips>
              ${[
                ["3", "3 days"],
                ["7", "1 week"],
                ["14", "2 weeks"],
                ["30", "1 month"],
              ]
                .map(([value, label], index) => `<button type="button" class="chip ${index === 1 ? "on" : ""}" data-due="${value}">${label}</button>`)
                .join("")}
            </div>
            <input type="hidden" name="dueOffset" value="7" />
            <p class="hint" style="margin-top:8px">Push reminders start 3 days before this date and continue through the due date.</p>
          </div>
          <button class="btn btn-primary" type="submit">Save split</button>
        </form>
      </div>
    </section>
  `;
}

function viewSettle(state, me, id, ui) {
  const user = state.users.find((item) => item.id === id);
  const rows = friendSummaries(me.id, state.users, state.expenses, state.settlements);
  const row = rows.find((item) => item.user.id === id);
  const amount = row?.youOwe || 0;
  const method = ui.method || "card";
  return `
    <div class="topbar">
      <button class="back" data-go="#/friend/${id}">${ICONS.back} Back</button>
      <b>Settle up</b>
      <span></span>
    </div>
    <section class="screen">
      <div class="pad">
        <p class="hint">You owe ${esc(user?.name ?? "this friend")}</p>
        <p class="pay-amount">${money(amount)}</p>
        <form class="form" data-form="settle" data-to="${id}" data-amount="${amount}">
          <label>Payment method</label>
          <div class="methods">
            <button type="button" class="method ${method === "card" ? "on" : ""}" data-method="card">
              <div><b>Credit card</b><span>Pay through Harbor, an external card gateway</span></div>
            </button>
            <button type="button" class="method ${method === "debit" ? "on" : ""}" data-method="debit">
              <div><b>Debit / bank</b><span>ACH-style debit transfer</span></div>
            </button>
            <button type="button" class="method ${method === "cash" ? "on" : ""}" data-method="cash">
              <div><b>Cash</b><span>Record a cash handoff</span></div>
            </button>
          </div>
          <input type="hidden" name="method" value="${method}" />
          <button class="btn btn-primary" type="submit" ${amount <= 0 ? "disabled" : ""}>${method === "card" ? "Continue to Harbor" : "Record payment"}</button>
        </form>
      </div>
    </section>
  `;
}

function viewActivity(state) {
  const items = [
    ...state.notifications.map((item) => ({
      text: item.body,
      createdAt: item.createdAt,
      kind: item.type,
    })),
    ...state.activity.map((item) => ({ text: item.text, createdAt: item.createdAt, kind: "act" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `
    ${topbar("Activity")}
    <section class="screen">
      <div class="pad">
        ${items
          .map(
            (item) => `
          <div class="activity-item">
            <b>${esc(item.text)}</b>
            <span>${formatStamp(item.createdAt)}</span>
          </div>`
          )
          .join("")}
      </div>
    </section>
  `;
}

function viewCredit(state, me) {
  const score = creditScore(me.id, state.expenses, state.settlements, state.reports);
  const band = scoreBand(score);
  const mine = state.reports.filter((report) => report.subjectId === me.id || report.reporterId === me.id);
  const overduePeople = friendSummaries(me.id, state.users, state.expenses, state.settlements).filter(
    (row) => reportableDebts(me.id, row.user.id, state.expenses, state.settlements, state.reports).length
  );
  return `
    ${topbar("Credit")}
    <section class="screen">
      <div class="pad">
        <article class="score-card">
          <em>Evenly Credit standing</em>
          <div class="score-num">${score}</div>
          <span class="pill ${band.tone === "good" ? "" : band.tone === "warn" ? "warn" : "bad"}">${band.label}</span>
        </article>
        <p class="legal">You can report an individual to Evenly Credit after their agreed repayment date passes. This file is in-network standing for unpaid splits. It does not furnish data to Equifax, Experian, or TransUnion unless a licensed consumer-reporting partner is added in production.</p>
        <div class="section-title"><span>Report unpaid splits</span></div>
        ${
          overduePeople.length
            ? `<div class="list">${overduePeople
                .map(
                  (row) => `
              <button class="row" data-go="#/report/${row.user.id}">
                ${avatar(row.user)}
                <div class="meta"><b>${esc(row.user.name)}</b><span>Overdue · ${money(row.theyOwe)}</span></div>
                <span class="pill bad">Report</span>
              </button>`
                )
                .join("")}</div>`
            : `<p class="empty">No overdue unpaid splits right now.</p>`
        }
        <div class="section-title"><span>Credit file</span></div>
        ${
          mine.length
            ? mine
                .map((report) => {
                  const subject = state.users.find((user) => user.id === report.subjectId);
                  const reporter = state.users.find((user) => user.id === report.reporterId);
                  return `<div class="row"><div class="meta"><b>${esc(subject?.name)} · ${report.status}</b><span>Filed by ${esc(reporter?.name)} · ${money(report.amount)}</span></div></div>`;
                })
                .join("")
            : `<p class="note">No reports on file. Pay on time to keep a strong standing.</p>`
        }
      </div>
    </section>
  `;
}

function viewReport(state, me, id) {
  const user = state.users.find((item) => item.id === id);
  const debts = reportableDebts(me.id, id, state.expenses, state.settlements, state.reports);
  const amount = debts.reduce((sum, item) => sum + item.remaining, 0);
  return `
    <div class="topbar">
      <button class="back" data-go="#/credit">${ICONS.back} Credit</button>
      <b>File report</b>
      <span></span>
    </div>
    <section class="screen">
      <div class="pad">
        <h2 style="margin-top:0">Report ${esc(user?.name ?? "user")} to credit</h2>
        <p class="hint">Only overdue, unpaid splits can be filed. This records a late mark on their Evenly Credit file.</p>
        <div class="list" style="margin:12px 0">
          ${debts
            .map(
              (item) => `
            <div class="row">
              <div class="meta"><b>${esc(item.expense.description)}</b><span>Due ${formatDay(item.expense.dueDate)} · ${Math.abs(daysUntil(item.expense.dueDate))}d late</span></div>
              <span class="amt bad">${money(item.remaining)}</span>
            </div>`
            )
            .join("") || `<p class="empty">Nothing reportable.</p>`}
        </div>
        <form class="form" data-form="report" data-subject="${id}" data-amount="${amount}" data-expenses="${debts.map((item) => item.expense.id).join(",")}">
          <div>
            <label>Reason</label>
            <textarea name="reason" rows="3" required>Did not clear the split by the agreed repayment date.</textarea>
          </div>
          <label class="check">
            <input type="checkbox" name="confirm" required />
            <span>I confirm this balance is still unpaid after the timeline we set, and I want it recorded on ${esc(user?.name ?? "this user")}'s credit file.</span>
          </label>
          <button class="btn btn-danger" type="submit" ${amount <= 0 ? "disabled" : ""}>File ${money(amount)} report</button>
        </form>
      </div>
    </section>
  `;
}

function viewAlerts(state) {
  const items = [...state.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `
    <div class="topbar">
      <button class="back" data-go="#/home">${ICONS.back} Back</button>
      <b>Reminders</b>
      <button class="btn btn-ghost" style="width:auto" data-action="enable-push">Enable push</button>
    </div>
    <section class="screen">
      <div class="pad">
        <p class="note">Alerts fire for the last 3 days of a repayment timeline — 3 days out, 2 days out, the day before, and the due date.</p>
        ${
          items.length
            ? items
                .map(
                  (item) => `
            <div class="activity-item">
              <b>${esc(item.title)}</b>
              <span>${esc(item.body)}</span>
            </div>`
                )
                .join("")
            : `<p class="empty">No reminders yet.</p>`
        }
      </div>
    </section>
  `;
}

function viewProfile(state, me) {
  return `
    ${topbar("Account")}
    <section class="screen">
      <div class="pad">
        <div class="person-head">${avatar(me, 56)}<div><h2>${esc(me.name)}</h2><p>${esc(me.email)}</p></div></div>
        <p class="note">Evenly is free. Switch demo accounts to see the other side of a split, a card payment, or a credit report.</p>
        <div class="section-title"><span>View as</span></div>
        <div class="list">
          ${state.users
            .map(
              (user) => `
            <button class="row" data-action="switch" data-user="${user.id}">
              ${avatar(user)}
              <div class="meta"><b>${esc(user.name)}</b><span>${esc(user.email)}</span></div>
              ${user.id === me.id ? `<span class="pill">You</span>` : ""}
            </button>`
            )
            .join("")}
        </div>
        <button class="btn btn-ghost" data-action="reset" style="margin-top:16px">Reset demo data</button>
      </div>
    </section>
  `;
}

function checkoutSheet(state, me, checkout) {
  const to = state.users.find((user) => user.id === checkout.toId);
  if (checkout.phase === "processing") {
    return `<div class="sheet"><div class="sheet-card"><div class="spin"></div><p class="hint" style="text-align:center">Harbor is authorizing your card…</p></div></div>`;
  }
  if (checkout.phase === "done") {
    return `
      <div class="sheet">
        <div class="sheet-card receipt">
          <div class="logo" style="margin-bottom:8px"><div><span></span><span></span></div></div>
          <h3>Paid ${money(checkout.amount)}</h3>
          <p class="hint">Card ${checkout.brand || "Visa"} ···· ${esc(checkout.last4 || "4242")} cleared this split with ${esc(to?.name ?? "your friend")}.</p>
          <button class="btn btn-primary" data-action="close-checkout">Done</button>
        </div>
      </div>`;
  }
  return `
    <div class="sheet">
      <div class="sheet-card">
        <div class="harbor">
          <div class="harbor-mark"><i>H</i> Harbor</div>
          <button class="back" data-action="close-checkout">Close</button>
        </div>
        <p class="hint">Secure checkout · pay ${esc(to?.name ?? "friend")}</p>
        <p class="pay-amount">${money(checkout.amount)}</p>
        <form class="form" data-form="card">
          <div class="card-grid">
            <div class="wide">
              <label>Card number</label>
              <input class="field" name="number" inputmode="numeric" placeholder="4242 4242 4242 4242" required />
            </div>
            <div>
              <label>Expiry</label>
              <input class="field" name="expiry" placeholder="12/28" required />
            </div>
            <div>
              <label>CVC</label>
              <input class="field" name="cvc" inputmode="numeric" placeholder="123" maxlength="4" required />
            </div>
            <div class="wide">
              <label>Name on card</label>
              <input class="field" name="name" value="${esc(me.name)}" required />
            </div>
          </div>
          <p class="hint">Demo gateway: use 4242 4242 4242 4242. In production this sheet is replaced by Stripe, Adyen, or another processor.</p>
          <button class="btn btn-gold" type="submit">Pay ${money(checkout.amount)}</button>
        </form>
      </div>
    </div>
  `;
}

function topbar(title, unread = 0) {
  return `
    <div class="topbar">
      <h1>${title}</h1>
      <div style="display:flex;gap:8px">
        <button class="icon-btn" data-go="#/alerts" aria-label="Notifications">
          ${ICONS.bell}${unread ? `<span class="badge"></span>` : ""}
        </button>
        <button class="icon-btn" data-go="#/profile" aria-label="Account">${avatarMini()}</button>
      </div>
    </div>
  `;
}

function tabs(active) {
  const items = [
    ["home", ICONS.home, "Home"],
    ["groups", ICONS.groups, "Groups"],
    ["add", ICONS.plus, ""],
    ["activity", ICONS.activity, "Activity"],
    ["credit", ICONS.credit, "Credit"],
  ];
  return `
    <nav class="tabs">
      ${items
        .map(([name, icon, label]) => {
          const cls = name === "add" ? "tab add" : `tab ${active === name ? "active" : ""}`;
          return `<button class="${cls}" data-go="#/${name}">${icon}${label ? `<span>${label}</span>` : ""}</button>`;
        })
        .join("")}
    </nav>
  `;
}

function avatar(user, size = 42) {
  return `<div class="avatar" style="background:${user.color};width:${size}px;height:${size}px;font-size:${size > 40 ? 14 : 11}px">${initials(user.name)}</div>`;
}

function avatarMini() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3"/><path d="M5 19c1.2-3 3.5-4.5 7-4.5s5.8 1.5 7 4.5"/></svg>`;
}

function groupIcon(type) {
  if (type === "home") return "Home";
  if (type === "trip") return "Trip";
  return "Group";
}

function expenseRow(expense, me, state) {
  const payer = state.users.find((user) => user.id === expense.paidById);
  const mine = expense.shares[me.id] || 0;
  const status = dueStatus(
    expense.dueDate,
    expense.paidById === me.id ? 0 : mine
  );
  const pill =
    expense.dueDate && expense.paidById !== me.id
      ? `<span class="pill ${status.kind === "overdue" ? "bad" : status.kind === "soon" || status.kind === "due" ? "warn" : "muted"}">${status.label}</span>`
      : expense.dueDate
        ? `<span class="pill muted">Due ${formatDay(expense.dueDate)}</span>`
        : "";
  return `
    <div class="row">
      <div class="meta">
        <b>${esc(expense.description)}</b>
        <span>${esc(payer?.name)} paid ${money(expense.amount)}${expense.dueDate ? ` · due ${formatDay(expense.dueDate)}` : ""}</span>
      </div>
      ${pill}
    </div>
  `;
}

function timelineCard(dueDate, createdAt) {
  const steps = dueTimeline(dueDate, createdAt);
  return `
    <div class="timeline">
      <div class="section-title" style="margin-top:0"><span>Repayment timeline</span><span>3-day reminder window</span></div>
      <ol>
        ${steps
          .map((step) => {
            const days = daysUntil(step.date);
            const past = days < 0;
            return `<li><span class="dot ${step.tone}"></span><div><b>${esc(step.label)}</b><div class="hint" style="margin:0">${formatDay(step.date, { month: "short", day: "numeric", year: "numeric" })}</div></div><small>${past ? "done" : days === 0 ? "today" : `${days}d`}</small></li>`;
          })
          .join("")}
      </ol>
    </div>
  `;
}

function statusChip(row) {
  const open = [...row.openFromYou, ...row.openToYou][0];
  if (!open?.expense.dueDate) return row.net === 0 ? "All clear" : "Open balance";
  const status = dueStatus(open.expense.dueDate, open.remaining);
  return status.label;
}

export function parseRoute() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = hash.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));
  if (parts[0] === "friend") return { name: "friend", id: parts[1] };
  if (parts[0] === "groups") return { name: "groups" };
  if (parts[0] === "group") return { name: "group", id: parts[1] };
  if (parts[0] === "add") return { name: "add", ...params };
  if (parts[0] === "settle") return { name: "settle", id: parts[1] };
  if (parts[0] === "activity") return { name: "activity" };
  if (parts[0] === "credit") return { name: "credit" };
  if (parts[0] === "report") return { name: "report", id: parts[1] };
  if (parts[0] === "alerts") return { name: "alerts" };
  if (parts[0] === "profile") return { name: "profile" };
  if (parts[0] === "home") return { name: "home" };
  return { name: "splash" };
}

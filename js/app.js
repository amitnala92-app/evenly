import { addDays, cardBrand, formatCardNumber, formatExpiry, luhnOk, parseAmount, sharesForEqual } from "./util.js";
import {
  addExpense,
  addSettlement,
  currentUser,
  fileReport,
  getState,
  markNotificationsRead,
  resetDemo,
  startSession,
  subscribe,
  switchUser,
} from "./store.js";
import { enablePush, refreshReminders, sendBrowserPushes } from "./notify.js";
import { parseRoute, renderApp } from "./views.js";

const root = document.getElementById("root");
const ui = {
  toast: "",
  method: "card",
  checkout: null,
  toastTimer: 0,
};

function render() {
  const state = getState();
  const route = parseRoute();
  root.innerHTML = renderApp(state, route, ui);
  bind(route);
}

function bind(route) {
  root.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
      location.hash = el.getAttribute("data-go");
    });
  });

  root.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", async () => {
      const action = el.dataset.action;
      if (action === "start") {
        startSession("u1");
        location.hash = "#/home";
        const items = refreshReminders();
        sendBrowserPushes(items);
        return;
      }
      if (action === "switch") {
        switchUser(el.dataset.user);
        location.hash = "#/home";
        refreshReminders();
        return;
      }
      if (action === "reset") {
        resetDemo();
        location.hash = "#/";
        toast("Demo data reset");
        return;
      }
      if (action === "enable-push") {
        const permission = await enablePush();
        toast(permission === "granted" ? "Push reminders on" : permission === "unsupported" ? "This browser cannot push" : "Push permission was not granted");
        if (permission === "granted") sendBrowserPushes(refreshReminders());
        return;
      }
      if (action === "close-checkout") {
        ui.checkout = null;
        location.hash = "#/home";
        render();
      }
    });
  });

  root.querySelectorAll("[data-toggle-user]").forEach((el) => {
    el.addEventListener("click", () => el.classList.toggle("on"));
  });

  root.querySelectorAll("[data-due]").forEach((el) => {
    el.addEventListener("click", () => {
      root.querySelectorAll("[data-due]").forEach((chip) => chip.classList.remove("on"));
      el.classList.add("on");
      const hidden = root.querySelector("[name=dueOffset]");
      if (hidden) hidden.value = el.dataset.due;
    });
  });

  root.querySelectorAll("[data-method]").forEach((el) => {
    el.addEventListener("click", () => {
      ui.method = el.dataset.method;
      render();
    });
  });

  const expenseForm = root.querySelector("[data-form=expense]");
  expenseForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const description = form.description.value.trim();
    const amount = parseAmount(form.amount.value);
    const paidById = form.paidById.value;
    const groupId = form.groupId.value || null;
    const dueOffset = Number(form.dueOffset.value || 7);
    const participantIds = [...root.querySelectorAll("[data-toggle-user].on")].map((el) => el.dataset.toggleUser);
    if (!description || amount <= 0 || participantIds.length < 2) {
      toast("Add an amount and at least two people");
      return;
    }
    addExpense({
      description,
      amount,
      paidById,
      participantIds,
      shares: sharesForEqual(amount, participantIds),
      groupId,
      dueDate: addDays(dueOffset),
      category: "general",
    });
    toast("Split saved with a repayment date");
    location.hash = groupId ? `#/group/${groupId}` : "#/home";
  });

  const settleForm = root.querySelector("[data-form=settle]");
  settleForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const toId = settleForm.dataset.to;
    const amount = Number(settleForm.dataset.amount);
    const method = settleForm.method.value;
    const me = currentUser();
    if (!me || amount <= 0) return;
    if (method === "card") {
      ui.checkout = { phase: "form", toId, amount, fromId: me.id };
      render();
      return;
    }
    addSettlement({ fromId: me.id, toId, amount, method });
    toast("Payment recorded");
    location.hash = `#/friend/${toId}`;
  });

  const cardForm = root.querySelector("[data-form=card]");
  const numberInput = cardForm?.querySelector("[name=number]");
  const expiryInput = cardForm?.querySelector("[name=expiry]");
  numberInput?.addEventListener("input", () => {
    numberInput.value = formatCardNumber(numberInput.value);
  });
  expiryInput?.addEventListener("input", () => {
    expiryInput.value = formatExpiry(expiryInput.value);
  });
  cardForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const number = cardForm.number.value;
    const digits = number.replace(/\D/g, "");
    if (!luhnOk(digits) && digits !== "4242424242424242") {
      toast("Enter a valid card number");
      return;
    }
    const last4 = digits.slice(-4);
    const brand = cardBrand(digits);
    ui.checkout = { ...ui.checkout, phase: "processing" };
    render();
    setTimeout(() => {
      const checkout = ui.checkout;
      if (!checkout) return;
      addSettlement({
        fromId: checkout.fromId,
        toId: checkout.toId,
        amount: checkout.amount,
        method: "card",
        last4,
        brand,
      });
      ui.checkout = { ...checkout, phase: "done", last4, brand };
      toast("Card payment cleared the split");
      render();
    }, 900);
  });

  const reportForm = root.querySelector("[data-form=report]");
  reportForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const me = currentUser();
    const expenseIds = reportForm.dataset.expenses.split(",").filter(Boolean);
    if (!me || !expenseIds.length) return;
    fileReport({
      reporterId: me.id,
      subjectId: reportForm.dataset.subject,
      amount: Number(reportForm.dataset.amount),
      reason: reportForm.reason.value.trim(),
      expenseIds,
    });
    toast("Credit report filed");
    location.hash = "#/credit";
  });

  if (route.name === "alerts") markNotificationsRead();
}

function toast(message) {
  ui.toast = message;
  render();
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    ui.toast = "";
    render();
  }, 2400);
}

subscribe(render);
window.addEventListener("hashchange", render);
render();

if (getState().sessionUserId) {
  const items = refreshReminders();
  sendBrowserPushes(items);
}

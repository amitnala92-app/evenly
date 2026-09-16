import { addDays, sharesForEqual, uid } from "./util.js";

export function createSeed() {
  const users = [
    { id: "u1", name: "Asrith Mitnala", email: "asrith@evenly.app", color: "#173F33" },
    { id: "u2", name: "Maya Chen", email: "maya@evenly.app", color: "#9A3B2F" },
    { id: "u3", name: "Jordan Hale", email: "jordan@evenly.app", color: "#2C5F8A" },
    { id: "u4", name: "Priya Shah", email: "priya@evenly.app", color: "#6B4C9A" },
    { id: "u5", name: "Alex Rivera", email: "alex@evenly.app", color: "#8A5A12" },
  ];

  const groups = [
    { id: "g1", name: "Oak Street Apt", type: "home", memberIds: ["u1", "u2"] },
    { id: "g2", name: "Big Sur Weekend", type: "trip", memberIds: ["u1", "u3", "u4"] },
    { id: "g3", name: "Brunch Club", type: "other", memberIds: ["u1", "u4", "u5"] },
  ];

  const expenses = [
    expense("e1", "September rent", 240000, "u1", ["u1", "u2"], "g1", "home", addDays(-5), addDays(-20)),
    expense("e2", "Utilities", 18640, "u2", ["u1", "u2"], "g1", "utilities", addDays(5), addDays(-6)),
    expense("e3", "Airbnb Big Sur", 184200, "u3", ["u1", "u3", "u4"], "g2", "stay", addDays(2), addDays(-8)),
    expense("e4", "Groceries & gas", 8765, "u1", ["u1", "u3", "u4"], "g2", "food", addDays(2), addDays(-7)),
    expense("e5", "Coastal highway gas", 6400, "u4", ["u1", "u3", "u4"], "g2", "travel", addDays(10), addDays(-6)),
    expense("e6", "Saturday brunch", 7410, "u5", ["u1", "u4", "u5"], "g3", "food", addDays(-2), addDays(-3)),
    expense("e7", "Dinner at Bar Lucia", 9600, "u1", ["u1", "u5"], null, "food", addDays(1), addDays(-1)),
  ];

  const settlements = [
    {
      id: "s1",
      fromId: "u1",
      toId: "u5",
      amount: 2470,
      method: "cash",
      createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
      onTime: true,
      last4: null,
    },
  ];

  const reports = [];

  const activity = [
    act("Maya joined Oak Street Apt", addDays(-21)),
    act("Jordan added Airbnb Big Sur", addDays(-8)),
    act("You added September rent", addDays(-20)),
    act("You paid Alex $24.70 in cash", addDays(-1)),
  ];

  return {
    sessionUserId: null,
    users,
    groups,
    expenses,
    settlements,
    reports,
    notifications: [],
    notifiedKeys: {},
    activity,
  };
}

function expense(id, description, amount, paidById, participantIds, groupId, category, dueDate, createdDay) {
  return {
    id,
    description,
    amount,
    paidById,
    participantIds,
    shares: sharesForEqual(amount, participantIds),
    groupId,
    category,
    dueDate,
    createdAt: `${createdDay}T15:12:00.000Z`,
  };
}

function act(text, day) {
  return { id: uid("act"), text, createdAt: `${day}T18:00:00.000Z` };
}

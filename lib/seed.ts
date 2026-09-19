import { sharesForEqual } from "@/lib/format";
import type { EvenlyState, Expense } from "@/lib/types";

const users = [
  { id: "u1", name: "Asrith Mitnala", color: "#0F766E" },
  { id: "u2", name: "Maya Chen", color: "#7C3AED" },
  { id: "u3", name: "Jordan Hale", color: "#0369A1" },
  { id: "u4", name: "Priya Shah", color: "#B45309" },
];

function expense(
  id: string,
  description: string,
  amount: number,
  paidById: string,
  participantIds: string[],
  createdAt: string,
  category: string
): Expense {
  return {
    id,
    description,
    amount,
    paidById,
    participantIds,
    shares: sharesForEqual(amount, participantIds),
    createdAt,
    category,
  };
}

const all = ["u1", "u2", "u3", "u4"] as const;

export const GROUPS = [
  {
    id: "g-cabin",
    name: "Cabin Trip 🌲",
    slug: "cabin-trip",
    inviteUrl: "https://evenly.app/join/cabin-trip",
  },
  {
    id: "g-nyc",
    name: "NYC Weekend",
    slug: "nyc-weekend",
    inviteUrl: "https://evenly.app/join/nyc-weekend",
  },
  {
    id: "g-house",
    name: "House Bills",
    slug: "house-bills",
    inviteUrl: "https://evenly.app/join/house-bills",
  },
] as const;

export function createSeed(): EvenlyState {
  const cabin = GROUPS[0];
  return {
    sessionUserId: "u1",
    users,
    group: {
      id: cabin.id,
      name: cabin.name,
      slug: cabin.slug,
      memberIds: [...all],
      inviteUrl: cabin.inviteUrl,
    },
    expenses: [
      expense(
        "e5",
        "Kayak rentals",
        12000,
        "u4",
        [...all],
        "2026-09-14T16:40:00.000Z",
        "travel"
      ),
      expense(
        "e4",
        "Wine & cheese night",
        16000,
        "u1",
        [...all],
        "2026-09-13T21:10:00.000Z",
        "food"
      ),
      expense(
        "e3",
        "Firewood & s'mores",
        3200,
        "u3",
        [...all],
        "2026-09-13T18:05:00.000Z",
        "home"
      ),
      expense(
        "e2",
        "Groceries",
        8640,
        "u1",
        [...all],
        "2026-09-12T11:20:00.000Z",
        "food"
      ),
      expense(
        "e1",
        "Cabin rental",
        40000,
        "u2",
        [...all],
        "2026-09-11T09:00:00.000Z",
        "stay"
      ),
    ],
    settlements: [],
  };
}

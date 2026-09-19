export type User = {
  id: string;
  name: string;
  color: string;
};

export type Group = {
  id: string;
  name: string;
  slug: string;
  memberIds: string[];
  inviteUrl: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  participantIds: string[];
  shares: Record<string, number>;
  createdAt: string;
  category: string;
};

export type Settlement = {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  createdAt: string;
};

export type EvenlyState = {
  sessionUserId: string;
  users: User[];
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
};

export type Transfer = {
  fromId: string;
  toId: string;
  amount: number;
};

export type AddExpenseInput = {
  description: string;
  amount: number;
  paidById: string;
  participantIds: string[];
  category?: string;
};

import API from "./axios";

export const getExpenses = () =>
  API.get("/finance/expenses");

export const addExpense = (data) =>
  API.post("/finance/expense", data);

export const updateExpense = (id, data) =>
  API.put(`/finance/expense/${id}`, data);

export const deleteExpense = (id) =>
  API.delete(`/finance/expense/${id}`);

export const getTodayExpense = () =>
  API.get("/finance/today-expense");

export const getTotalExpenses = () =>
  API.get("/finance/expenses-total");

export const getTodayExpenses = () =>
  API.get("/finance/today-expense");
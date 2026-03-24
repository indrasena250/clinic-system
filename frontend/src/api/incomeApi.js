import API from "./axios";

// GET all extra income
export const getIncome = () => {
  return API.get("/finance/income");
};

export const getIncomeSummary = () =>
 API.get("/finance/income-summary");

// ADD extra income
export const addIncome = (data) => {
  return API.post("/finance/income", data);
};

// UPDATE income
export const updateIncome = (id, data) => {
  return API.put(`/finance/income/${id}`, data);
};

// DELETE income
export const deleteIncome = (id) => {
  return API.delete(`/finance/income/${id}`);
};

// TOTAL extra income (for dashboard)
export const getIncomeTotal = () => {
  return API.get("/finance/income-total");
};

export const getTodayIncomeSummary = () => {
 return API.get("/finance/income-summary-today");
}; 
import API from "./axios";

export const fetchTodaySummary = async () => {

  const res = await API.get(`/patients/dashboard-summary`);

  return res.data;
};
import API from "./axios";
import dayjs from "dayjs";

export const getDailyReportSummary = async (date) => {

  const formattedDate = dayjs(date).format("YYYY-MM-DD");

  const res = await API.get(`/patients/daily-report-summary/${formattedDate}`);

  return res.data;
};

export const downloadDailyReportPdf = async (date) => {

  const formattedDate = dayjs(date).format("YYYY-MM-DD");

  const res = await API.get(`/patients/daily-report-pdf/${formattedDate}`, {
    responseType: "blob",
  });

  return res.data;
};
import API from "./axios";
import dayjs from "dayjs";
import { formatDate } from "../utils/date";

export const getDailyReportSummary = async (date) => {

  const formattedDate = formatDate(date);

  const res = await API.get(`/patients/daily-report-summary/${formattedDate}`);

  return res.data;
};

export const downloadDailyReportPdf = async (date) => {

  const formattedDate = formatDate(date);

  const res = await API.get(`/patients/daily-report-pdf/${formattedDate}`, {
    responseType: "blob",
  });

  return res.data;
};
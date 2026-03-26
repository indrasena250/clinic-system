import API from "./axios";
import dayjs from "dayjs";
import { formatDate } from "../utils/date";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const retryRequest = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn();
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      // Rate limited, wait and retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

export const getDailyReportSummary = async (date) => {

  const formattedDate = formatDate(date);

  const res = await retryRequest(() => 
    API.get(`/patients/daily-report-summary/${formattedDate}`)
  );

  return res.data;
};

export const downloadDailyReportPdf = async (date) => {

  const formattedDate = formatDate(date);

  const res = await retryRequest(() =>
    API.get(`/patients/daily-report-pdf/${formattedDate}`, {
      responseType: "blob",
    })
  );

  return res.data;
};
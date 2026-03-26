import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDateTime = (date) => {
  if (!date) return "-";
  // Backend sends IST strings already, parse directly in IST timezone
  return dayjs(date).tz("Asia/Kolkata").format("DD MMM YYYY, hh:mm A");
};

export const formatDate = (date) => {
  if (!date) return "-";
  // Backend sends IST strings already, parse directly in IST timezone
  return dayjs(date).tz("Asia/Kolkata").format("YYYY-MM-DD");
};

export const formatTime = (date) => {
  if (!date) return "-";
  // Backend sends IST strings already, parse directly in IST timezone
  return dayjs(date).tz("Asia/Kolkata").format("hh:mm A");
};

export const formatDateTimeRange = (date) => {
  if (!date) return "-";
  // Backend sends IST strings already, parse directly in IST timezone
  return dayjs(date).tz("Asia/Kolkata").format("DD/MM/YYYY hh:mm A");
};

export const formatCurrency = (num) =>
  `₹ ${Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDateTime = (date) => {
  if (!date) return "-";
  return dayjs.utc(date).tz("Asia/Kolkata").format("DD MMM YYYY, hh:mm A");
};

export const formatDate = (date) => {
  if (!date) return "-";
  return dayjs.utc(date).tz("Asia/Kolkata").format("YYYY-MM-DD");
};

export const formatTime = (date) => {
  if (!date) return "-";
  return dayjs.utc(date).tz("Asia/Kolkata").format("hh:mm A");
};
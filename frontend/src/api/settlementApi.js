import API from "./axios";

export const settle = async () => {
  const res = await API.post("/settle");
  return res.data;
};

import API from "./axios";

export const uploadSignature = async (file) => {
  const formData = new FormData();
  formData.append("signature", file);

  const res = await API.post("/patients/upload-signature", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const getClinicSettings = async () => {
  const res = await API.get("/clinics/current");
  return res.data;
};

export const updateClinicSettings = async (name, address, phone) => {
  const res = await API.patch("/clinics/current", { name, address, phone });
  return res.data;
};

export const getAllSignatures = async () => {
  const res = await API.get("/patients/signatures");
  return res.data;
};

export const getSignatureImage = async (id) => {
  const res = await API.get(`/patients/signature/${id}`, {
    responseType: "blob"
  });
  return res.data;
};

export const deleteSignature = async (id) => {
  const res = await API.delete(`/patients/signature/${id}`);
  return res.data;
};
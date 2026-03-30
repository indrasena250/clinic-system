import API from "./axios";

export const createPatient = async (data) => {
  const response = await API.post("/patients/add", data);
  return response.data;
};
export const fetchCTPatients = async () => {
  const response = await API.get("/patients/ct");
  return response.data;
};

export const fetchUltrasoundPatients = async () => {
  const response = await API.get("/patients/ultrasound");
  return response.data;
};
export const updatePatient = async (id, data) => {
  const response = await API.put(`/patients/${id}`, data);
  return response.data;
};
export const fetchAllPatients = async () => {
  const responce = await API.get("/patients/all");
  return responce.data;
};
export const updateReferral = async (id, data) => {
  const res = await API.put(`/patients/referral/${id}`, data);
  return res.data;
};
export const fetchDoctorSettlement = async (doctor) => {
  const res = await API.get(`/patients/doctor-settlement/${doctor}`);
  return res.data;
};
export const fetchDoctors = async () => {
  const res = await API.get("/patients/doctors");
  return res.data;
};
export const downloadSettlementPDF = async (doctor, fromDate, toDate) => {

  const res = await API.get(
    `/patients/doctor-settlement-pdf/${doctor}/${fromDate}/${toDate}`,
    {
      responseType: "blob",
    }
  );

  return res.data;

};

export const fetchSettlementHistory = async () => {
  const res = await API.get("/patients/settlement-history");
  return res.data;
};

export const fetchInvoiceScans = async (invoiceId) => {
  const res = await API.get(`/patients/invoice/scans/${invoiceId}`);
  return res.data;
};

export const downloadSettlementPeriodPDF = async (settlementId) => {
  const res = await API.get(`/patients/settlement-pdf/${settlementId}`, {
    responseType: "blob",
  });
  return res.data;
};

export const fetchTodaySummary = async () => {
  const res = await API.get("/patients/dashboard-summary");
  return res.data;
};

export const downloadInvoicePDF = async (invoiceId) => {
  const res = await API.get(`/patients/invoice/pdf/${invoiceId}`, {
    responseType: "blob",
  });
  return res.data;
};

export const getNextPatientId = async () => {
  const res = await API.get("/patients/next-id");
  return res.data;
};

export const getNextCTId = async () => {
  const res = await API.get("/patients/next-id/ct");
  return res.data;
};

export const getNextUltraId = async () => {
  const res = await API.get("/patients/next-id/ultrasound");
  return res.data;
};
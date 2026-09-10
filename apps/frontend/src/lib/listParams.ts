export interface ListParams {
  page?: number;
  limit?: number;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  severity?: string;
  category?: string;
  lang?: string;
  status?: string;
  search?: string;
  patientId?: string;
}
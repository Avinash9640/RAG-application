import { request } from "./api";


export async function getAuditLogs(limit = 100) {
    return request(`/api/audit-logs?limit=${limit}`);
}

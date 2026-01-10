import { getLeadByName } from './leads.service';

export type LeadDetailRow = { label: string; value?: string };
export type LeadDetailSection = { title: string; rows: LeadDetailRow[] };

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const normalizeValue = (value?: string | number | null) => {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'string') return value.trim() || '-';
  return String(value);
};

export const fetchLeadDetail = async (name: string, companyUrl?: string): Promise<any> => {
  return getLeadByName(name, companyUrl);
};

export const buildLeadDetailSections = (lead: any): LeadDetailSection[] => {
  return [
    {
      title: 'General',
      rows: [
        { label: 'Date', value: formatDateTime(lead?.creation) },
        {
          label: 'Full Name',
          value: normalizeValue(lead?.lead_name || lead?.company_name || lead?.name),
        },
        { label: 'Job Title', value: normalizeValue(lead?.job_title) },
        { label: 'Gender', value: normalizeValue(lead?.gender) },
        { label: 'Status', value: normalizeValue(lead?.status || 'Open') },
        { label: 'Lead Type', value: normalizeValue(lead?.lead_type) },
        { label: 'Request Type', value: normalizeValue(lead?.request_type) },
        { label: 'Service Type', value: normalizeValue(lead?.service_type) },
        { label: 'Source', value: normalizeValue(lead?.source) },
      ],
    },
    {
      title: 'Contact',
      rows: [
        { label: 'Email', value: normalizeValue(lead?.email_id) },
        { label: 'Mobile No', value: normalizeValue(lead?.mobile_no || lead?.phone) },
        { label: 'WhatsApp', value: normalizeValue(lead?.whatsapp || lead?.whatsapp_no) },
        { label: 'Website', value: normalizeValue(lead?.website) },
      ],
    },
    {
      title: 'Organization',
      rows: [
        { label: 'Organization Name', value: normalizeValue(lead?.company_name) },
        {
          label: 'Building & Location',
          value: normalizeValue(lead?.building || lead?.location),
        },
        { label: 'Territory', value: normalizeValue(lead?.territory) },
        {
          label: 'No of Employees',
          value: normalizeValue(lead?.no_of_employees ?? lead?.number_of_employees),
        },
        { label: 'Industry', value: normalizeValue(lead?.industry) },
      ],
    },
    {
      title: 'Ownership',
      rows: [
        { label: 'Lead Owner', value: normalizeValue(lead?.owner) },
        { label: 'Associate Details', value: normalizeValue(lead?.associate_details) },
      ],
    },
  ];
};

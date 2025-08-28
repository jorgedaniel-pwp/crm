import axios, { AxiosInstance } from 'axios';

interface Lead {
  ycn_leadid?: string;
  ycn_name: string;
  ycn_rating: number;
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
}

interface DataverseResponse<T> {
  value: T[];
  '@odata.context'?: string;
  '@odata.nextLink'?: string;
}

class DataverseClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;

  constructor(accessToken: string) {
    this.baseUrl = process.env.NEXT_PUBLIC_DATAVERSE_URL || 'https://orgb29f60b6.crm4.dynamics.com';
    
    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/api/data/v9.2`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'odata.include-annotations="*"'
      }
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          console.error('Unauthorized: Token may be expired');
        }
        return Promise.reject(error);
      }
    );
  }

  async getLeads(): Promise<Lead[]> {
    try {
      const response = await this.axiosInstance.get<DataverseResponse<Lead>>(
        '/ycn_leads?$select=ycn_leadid,ycn_name,ycn_rating,createdon,modifiedon&$filter=statecode eq 0&$orderby=createdon desc'
      );
      return response.data.value;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  async getLead(leadId: string): Promise<Lead> {
    try {
      const response = await this.axiosInstance.get<Lead>(
        `/ycn_leads(${leadId})?$select=ycn_leadid,ycn_name,ycn_rating,createdon,modifiedon`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  }

  async createLead(lead: Omit<Lead, 'ycn_leadid' | 'createdon' | 'modifiedon'>): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/ycn_leads', lead);
      
      // Extract the ID from the OData-EntityId header
      const entityIdHeader = response.headers['odata-entityid'];
      if (entityIdHeader) {
        const match = entityIdHeader.match(/\(([^)]+)\)/);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      throw new Error('Failed to get created lead ID');
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
    try {
      await this.axiosInstance.patch(
        `/ycn_leads(${leadId})`,
        updates,
        {
          headers: {
            'If-Match': '*'
          }
        }
      );
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  async deleteLead(leadId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ycn_leads(${leadId})`);
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  // Test connection to Dataverse
  async testConnection(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/WhoAmI');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export default DataverseClient;
export type { Lead, DataverseResponse };
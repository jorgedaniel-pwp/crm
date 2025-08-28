interface DataverseConfig {
  baseUrl: string;
  clientId: string;
  clientSecret?: string;
  tenantId: string;
  scope?: string;
}

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

class DataverseService {
  private config: DataverseConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: Partial<DataverseConfig>) {
    this.config = {
      baseUrl: config.baseUrl || process.env.DATAVERSE_URL || 'https://orgb29f60b6.crm4.dynamics.com',
      clientId: config.clientId || process.env.DATAVERSE_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.DATAVERSE_CLIENT_SECRET || '',
      tenantId: config.tenantId || process.env.DATAVERSE_TENANT_ID || '',
      scope: config.scope || `${config.baseUrl || process.env.DATAVERSE_URL}/.default`
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    if (!this.config.clientId || !this.config.clientSecret || !this.config.tenantId) {
      console.warn('Dataverse credentials not configured. Using demo mode.');
      return 'demo-token';
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: this.config.scope!,
        grant_type: 'client_credentials'
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token acquisition failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      console.error('Failed to acquire access token:', error);
      return 'demo-token';
    }
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const token = await this.getAccessToken();
    
    if (token === 'demo-token') {
      return this.getDemoData(endpoint) as T;
    }

    const url = `${this.config.baseUrl}/api/data/v9.2/${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dataverse API error: ${response.statusText} - ${error}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('Dataverse request failed:', error);
      throw error;
    }
  }

  private getDemoData(endpoint: string): any {
    if (endpoint.includes('ycn_lead')) {
      return {
        value: [
          {
            ycn_leadid: "e961a0d4-8f83-f011-b4cc-002248851227",
            ycn_name: "Hot Lead Opportunity",
            ycn_rating: 100000001,
            createdon: "2025-08-27T21:50:22",
            modifiedon: "2025-08-27T21:50:22"
          },
          {
            ycn_leadid: "23ac10c6-8f83-f011-b4cc-7ced8d5d35d9",
            ycn_name: "Cold Lead Example",
            ycn_rating: 100000001,
            createdon: "2025-08-27T21:50:00",
            modifiedon: "2025-08-27T21:50:00"
          },
          {
            ycn_leadid: "3945f192-8f83-f011-b4cc-7ced8d5d35d9",
            ycn_name: "Updated Test Lead - Hot",
            ycn_rating: 100000001,
            createdon: "2025-08-27T21:48:41",
            modifiedon: "2025-08-27T21:49:38"
          }
        ]
      };
    }
    return { value: [] };
  }

  async getLeads(): Promise<Lead[]> {
    const query = '$select=ycn_leadid,ycn_name,ycn_rating,createdon,modifiedon&$filter=statecode eq 0&$orderby=createdon desc';
    const response = await this.makeRequest<DataverseResponse<Lead>>('GET', `ycn_leads?${query}`);
    return response.value;
  }

  async getLead(leadId: string): Promise<Lead> {
    const select = '$select=ycn_leadid,ycn_name,ycn_rating,createdon,modifiedon';
    return await this.makeRequest<Lead>('GET', `ycn_leads(${leadId})?${select}`);
  }

  async createLead(lead: Omit<Lead, 'ycn_leadid' | 'createdon' | 'modifiedon'>): Promise<string> {
    const response = await this.makeRequest('POST', 'ycn_leads', lead);
    
    if (typeof response === 'object' && 'ycn_leadid' in response) {
      return (response as any).ycn_leadid;
    }
    
    const timestamp = Date.now();
    return `demo-${timestamp}`;
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
    await this.makeRequest(
      'PATCH',
      `ycn_leads(${leadId})`,
      updates,
      { 'If-Match': '*' }
    );
  }

  async deleteLead(leadId: string): Promise<void> {
    await this.makeRequest('DELETE', `ycn_leads(${leadId})`);
  }
}

export const dataverseService = new DataverseService({});
export type { Lead, DataverseResponse };
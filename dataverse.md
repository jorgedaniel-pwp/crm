# Microsoft Dataverse API CRUD Operations Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Basic CRUD Operations](#basic-crud-operations)
3. [Query and Filtering (OData)](#query-and-filtering-odata)
4. [Working with Relationships](#working-with-relationships)
5. [Batch Operations](#batch-operations)
6. [Error Handling](#error-handling)
7. [Best Practices and Performance](#best-practices-and-performance)
8. [Service Protection and Limits](#service-protection-and-limits)
9. [Code Examples](#code-examples)
10. [Official Documentation Links](#official-documentation-links)

---

## Authentication

### Overview
Microsoft Dataverse exclusively uses **OAuth 2.0** protocol with **Microsoft Entra ID** (formerly Azure AD) as the identity provider. All API requests must include valid access tokens obtained through the Microsoft Authentication Library (MSAL).

### Authentication Methods

#### 1. Interactive Authentication (User Delegated)
**Use Case:** Web applications and SPAs where users sign in interactively

```javascript
// JavaScript/MSAL Browser
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: "your-client-id",
        authority: "https://login.microsoftonline.com/your-tenant-id",
        redirectUri: "http://localhost:3000",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: true,
    }
};

const msalInstance = new PublicClientApplication(msalConfig);

async function getAccessToken() {
    const request = {
        scopes: ["https://yourorg.crm.dynamics.com/user_impersonation"]
    };
    
    try {
        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        const response = await msalInstance.acquireTokenPopup(request);
        return response.accessToken;
    }
}
```

#### 2. Application Authentication (Service Principal)
**Use Case:** Server-to-server scenarios, background services, scheduled tasks

```csharp
// C# with Connection String
string connectionString = @"
    AuthType=ClientSecret;
    Url=https://yourorg.crm.dynamics.com;
    ClientId=66667777-aaaa-8888-bbbb-9999cccc0000;
    Secret=aaaaaaaa-6b6b-7c7c-8d8d-999999999999";

using (ServiceClient service = new ServiceClient(connectionString))
{
    if (service.IsReady)
    {
        var response = (WhoAmIResponse)service.Execute(new WhoAmIRequest());
        Console.WriteLine($"Connected as: {response.UserId}");
    }
}
```

#### 3. Certificate Authentication
**Use Case:** Production environments requiring enhanced security

```csharp
string certThumbprint = "DC6C689022C905EA5F812B51F1574ED10F256FF6";
string appId = "00001111-aaaa-2222-bbbb-3333cccc4444";
string instanceUri = "https://yourorg.crm.dynamics.com";

string connectionString = $@"
    AuthType=Certificate;
    Url={instanceUri};
    thumbprint={certThumbprint};
    ClientId={appId}";

using (ServiceClient svc = new ServiceClient(connectionString))
{
    // Execute operations
}
```

### Required Headers for Web API Requests
```http
Authorization: Bearer {access_token}
OData-MaxVersion: 4.0
OData-Version: 4.0
Accept: application/json
Content-Type: application/json
```

---

## Basic CRUD Operations

### Create (POST)

#### Basic Create
```http
POST [Organization Uri]/api/data/v9.2/contacts HTTP/1.1
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "emailaddress1": "john.doe@example.com",
  "telephone1": "555-0100"
}
```

**Response:**
```http
HTTP/1.1 204 NoContent
OData-EntityId: [Organization Uri]/api/data/v9.2/contacts(00aa00aa-bb11-cc22-dd33-44ee44ee44ee)
```

#### Deep Insert (Create with Related Records)
```http
POST [Organization Uri]/api/data/v9.2/accounts HTTP/1.1
Content-Type: application/json

{
  "name": "Contoso Corporation",
  "primarycontactid": {
    "firstname": "Jane",
    "lastname": "Smith",
    "emailaddress1": "jane.smith@contoso.com"
  },
  "Account_Tasks": [
    {
      "subject": "Initial setup meeting",
      "scheduledstart": "2025-09-01T10:00:00Z",
      "scheduledend": "2025-09-01T11:00:00Z"
    }
  ]
}
```

#### JavaScript Example
```javascript
async function createContact(contactData) {
    const token = await getAccessToken();
    const response = await fetch(`${baseUrl}/api/data/v9.2/contacts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0'
        },
        body: JSON.stringify(contactData)
    });
    
    if (response.ok) {
        const entityId = response.headers.get('OData-EntityId');
        return entityId.split('(')[1].split(')')[0];
    }
    throw new Error(`Create failed: ${response.statusText}`);
}
```

### Read (GET)

#### Retrieve Single Record
```http
GET [Organization Uri]/api/data/v9.2/contacts(00aa00aa-bb11-cc22-dd33-44ee44ee44ee)?$select=fullname,emailaddress1,telephone1 HTTP/1.1
```

#### Retrieve with Related Data
```http
GET [Organization Uri]/api/data/v9.2/accounts(accountid)?$select=name&$expand=primarycontactid($select=fullname,emailaddress1)
```

#### Retrieve Multiple Records
```http
GET [Organization Uri]/api/data/v9.2/contacts?$select=fullname,emailaddress1&$filter=statecode eq 0&$orderby=createdon desc&$top=10
```

#### C# Example
```csharp
public async Task<Entity> GetContactAsync(Guid contactId)
{
    var columnSet = new ColumnSet("firstname", "lastname", "emailaddress1");
    return await serviceClient.RetrieveAsync("contact", contactId, columnSet);
}
```

### Update (PATCH)

#### Basic Update
```http
PATCH [Organization Uri]/api/data/v9.2/contacts(00aa00aa-bb11-cc22-dd33-44ee44ee44ee) HTTP/1.1
If-Match: *
Content-Type: application/json

{
  "telephone1": "555-0200",
  "jobtitle": "Senior Developer"
}
```

**Important:** Include `If-Match: *` header to ensure update operation (prevents accidental upsert)

#### Update Single Property
```http
PUT [Organization Uri]/api/data/v9.2/contacts(contactid)/telephone1 HTTP/1.1
Content-Type: application/json

{
  "value": "555-0300"
}
```

#### Python Example
```python
import requests

def update_contact(contact_id, data, access_token):
    url = f"{base_url}/api/data/v9.2/contacts({contact_id})"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "If-Match": "*",
        "Content-Type": "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0"
    }
    response = requests.patch(url, json=data, headers=headers)
    return response.status_code == 204
```

### Delete (DELETE)

#### Basic Delete
```http
DELETE [Organization Uri]/api/data/v9.2/contacts(00aa00aa-bb11-cc22-dd33-44ee44ee44ee) HTTP/1.1
```

#### JavaScript Example
```javascript
async function deleteRecord(entityName, recordId) {
    const token = await getAccessToken();
    const response = await fetch(`${baseUrl}/api/data/v9.2/${entityName}(${recordId})`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0'
        }
    });
    
    if (!response.ok && response.status !== 204) {
        throw new Error(`Delete failed: ${response.statusText}`);
    }
    return true;
}
```

### Upsert Operations

#### Basic Upsert
```http
PATCH [Organization Uri]/api/data/v9.2/contacts(email='john.doe@example.com') HTTP/1.1
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "telephone1": "555-0400"
}
```

**Note:** Without `If-Match` header, this performs an upsert (creates if doesn't exist, updates if exists)

#### Force Create Only
```http
PATCH [Organization Uri]/api/data/v9.2/contacts(contactid) HTTP/1.1
If-None-Match: *
Content-Type: application/json
```

#### Force Update Only
```http
PATCH [Organization Uri]/api/data/v9.2/contacts(contactid) HTTP/1.1
If-Match: *
Content-Type: application/json
```

---

## Query and Filtering (OData)

### Query Options

#### $select - Choose Columns
```http
GET /api/data/v9.2/accounts?$select=name,revenue,accountnumber
```

#### $filter - Filter Results
```http
# String functions
GET /api/data/v9.2/contacts?$filter=contains(fullname,'Smith')
GET /api/data/v9.2/contacts?$filter=startswith(firstname,'J')

# Comparison operators
GET /api/data/v9.2/accounts?$filter=revenue gt 100000
GET /api/data/v9.2/contacts?$filter=createdon ge 2025-01-01

# Logical operators
GET /api/data/v9.2/contacts?$filter=(statecode eq 0) and (emailaddress1 ne null)
```

#### $expand - Include Related Data
```http
# Single-valued navigation property
GET /api/data/v9.2/accounts?$expand=primarycontactid($select=fullname,emailaddress1)

# Collection-valued navigation property
GET /api/data/v9.2/accounts?$expand=contact_customer_accounts($select=fullname;$filter=statecode eq 0)

# Nested expansion
GET /api/data/v9.2/accounts?$expand=primarycontactid($select=fullname;$expand=createdby($select=fullname))
```

#### $orderby - Sort Results
```http
GET /api/data/v9.2/contacts?$orderby=createdon desc,lastname asc
```

#### $top - Limit Results
```http
GET /api/data/v9.2/accounts?$top=50
```

### Advanced Query Patterns

#### Lambda Operators
```http
# Any - at least one related record matches
GET /api/data/v9.2/accounts?$filter=Account_Tasks/any(t:t/statecode eq 0)

# All - all related records match
GET /api/data/v9.2/accounts?$filter=Account_Tasks/all(t:t/statecode eq 1)
```

#### Dataverse-Specific Functions
```http
# Last X Hours
GET /api/data/v9.2/contacts?$filter=Microsoft.Dynamics.CRM.LastXHours(PropertyName='createdon',PropertyValue='24')

# Between
GET /api/data/v9.2/accounts?$filter=Microsoft.Dynamics.CRM.Between(PropertyName='revenue',PropertyValues=["100000","500000"])

# In Fiscal Period
GET /api/data/v9.2/opportunities?$filter=Microsoft.Dynamics.CRM.InFiscalPeriod(PropertyName='actualclosedate',PropertyValue='3')
```

### FetchXML Queries

```xml
<fetch top="10">
  <entity name="account">
    <attribute name="name" />
    <attribute name="revenue" />
    <filter type="and">
      <condition attribute="revenue" operator="gt" value="100000" />
      <condition attribute="statecode" operator="eq" value="0" />
    </filter>
    <link-entity name="contact" from="contactid" to="primarycontactid">
      <attribute name="fullname" />
    </link-entity>
  </entity>
</fetch>
```

**Using FetchXML with Web API:**
```javascript
const fetchXml = encodeURIComponent(`
  <fetch top="10">
    <entity name="account">
      <attribute name="name" />
      <filter>
        <condition attribute="revenue" operator="gt" value="100000" />
      </filter>
    </entity>
  </fetch>
`);

const response = await fetch(`${baseUrl}/api/data/v9.2/accounts?fetchXml=${fetchXml}`);
```

---

## Working with Relationships

### Single-Valued Navigation Properties (Lookups)

#### Associate on Create
```json
{
  "name": "New Account",
  "primarycontactid@odata.bind": "contacts(00aa00aa-bb11-cc22-dd33-44ee44ee44ee)"
}
```

#### Update Association
```http
PATCH /api/data/v9.2/accounts(accountid) HTTP/1.1
{
  "primarycontactid@odata.bind": "contacts(newcontactid)"
}
```

#### Remove Association
```http
PATCH /api/data/v9.2/accounts(accountid) HTTP/1.1
{
  "primarycontactid@odata.bind": null
}
```

### Collection-Valued Navigation Properties

#### Add to Collection
```http
POST /api/data/v9.2/accounts(accountid)/contact_customer_accounts/$ref HTTP/1.1
{
  "@odata.id": "[Organization URI]/api/data/v9.2/contacts(contactid)"
}
```

#### Remove from Collection
```http
DELETE /api/data/v9.2/accounts(accountid)/contact_customer_accounts(contactid)/$ref
```

### Many-to-Many Relationships

```http
# Associate
POST /api/data/v9.2/systemusers(userid)/systemuserroles_association/$ref HTTP/1.1
{
  "@odata.id": "[Organization URI]/api/data/v9.2/roles(roleid)"
}

# Disassociate
DELETE /api/data/v9.2/systemusers(userid)/systemuserroles_association(roleid)/$ref
```

---

## Batch Operations

### Basic Batch Request

```http
POST [Organization Uri]/api/data/v9.2/$batch HTTP/1.1
Content-Type: multipart/mixed; boundary="batch_12345"

--batch_12345
Content-Type: application/http
Content-Transfer-Encoding: binary

POST /api/data/v9.2/contacts HTTP/1.1
Content-Type: application/json

{"firstname":"John","lastname":"Smith"}

--batch_12345
Content-Type: application/http
Content-Transfer-Encoding: binary

GET /api/data/v9.2/accounts?$top=5 HTTP/1.1

--batch_12345--
```

### Change Sets (Transactions)

```http
POST [Organization Uri]/api/data/v9.2/$batch HTTP/1.1
Content-Type: multipart/mixed; boundary="batch_AAA123"

--batch_AAA123
Content-Type: multipart/mixed; boundary="changeset_BBB456"

--changeset_BBB456
Content-Type: application/http
Content-Transfer-Encoding: binary
Content-ID: 1

POST /api/data/v9.2/contacts HTTP/1.1
Content-Type: application/json

{"firstname":"Jane","lastname":"Doe"}

--changeset_BBB456
Content-Type: application/http
Content-Transfer-Encoding: binary
Content-ID: 2

POST /api/data/v9.2/accounts HTTP/1.1
Content-Type: application/json

{"name":"Related Account","primarycontactid@odata.bind":"$1"}

--changeset_BBB456--
--batch_AAA123--
```

### Bulk Operations (CreateMultiple/UpdateMultiple)

```javascript
// CreateMultiple
const bulkCreate = {
    Targets: [
        { firstname: "John", lastname: "Doe", emailaddress1: "john@example.com" },
        { firstname: "Jane", lastname: "Smith", emailaddress1: "jane@example.com" },
        { firstname: "Bob", lastname: "Johnson", emailaddress1: "bob@example.com" }
    ]
};

const response = await fetch(`${baseUrl}/api/data/v9.2/contacts/Microsoft.Dynamics.CRM.CreateMultiple`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(bulkCreate)
});
```

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 200 | OK | Successful operation |
| 204 | No Content | Successful create/update/delete |
| 400 | Bad Request | Invalid syntax, malformed request |
| 401 | Unauthorized | Invalid or expired token |
| 403 | Forbidden | Insufficient privileges |
| 404 | Not Found | Record doesn't exist |
| 412 | Precondition Failed | ETag mismatch, If-None-Match violation |
| 429 | Too Many Requests | Service protection limit exceeded |

### Error Response Format

```json
{
  "error": {
    "code": "0x80040217",
    "message": "The specified record was not found.",
    "@Microsoft.PowerApps.CDS.ErrorDetails.OperationStatus": "0",
    "@Microsoft.PowerApps.CDS.HelpLink": "http://go.microsoft.com/fwlink/?LinkId=...",
    "@Microsoft.PowerApps.CDS.TraceText": "Detailed trace information...",
    "@Microsoft.PowerApps.CDS.InnerError.Message": "Additional error details"
  }
}
```

### JavaScript Error Handling

```javascript
async function safeCrudOperation() {
    try {
        const result = await createContact(contactData);
        return { success: true, data: result };
    } catch (error) {
        if (error.status === 429) {
            // Handle rate limiting
            const retryAfter = error.headers.get('Retry-After');
            await sleep(retryAfter * 1000);
            return safeCrudOperation(); // Retry
        } else if (error.status === 401) {
            // Handle authentication failure
            await refreshToken();
            return safeCrudOperation(); // Retry with new token
        } else if (error.status === 412) {
            // Handle optimistic concurrency
            console.error('Record was modified by another user');
            return { success: false, error: 'Concurrency conflict' };
        }
        
        // Generic error handling
        console.error('Operation failed:', error);
        return { success: false, error: error.message };
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

### C# Error Handling with Polly

```csharp
using Polly;
using Polly.Extensions.Http;

public static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        .WaitAndRetryAsync(
            3,
            retryAttempt => {
                var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(0, 100));
                return TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)) + jitter;
            },
            onRetry: (outcome, timespan, retryCount, context) =>
            {
                var logger = context.Values.ContainsKey("logger") ? 
                    context.Values["logger"] as ILogger : null;
                logger?.LogWarning($"Retry {retryCount} after {timespan} seconds");
            });
}
```

---

## Best Practices and Performance

### Query Optimization

1. **Always use $select** to limit columns returned
   ```http
   GET /api/data/v9.2/accounts?$select=name,revenue,accountnumber
   ```

2. **Apply filters early** to reduce data transfer
   ```http
   GET /api/data/v9.2/contacts?$filter=statecode eq 0&$select=fullname
   ```

3. **Use indexed columns** in filters when possible
4. **Avoid leading wildcards** in string searches
5. **Limit $expand depth** (maximum 10 levels, but use fewer for performance)

### Batch Operation Guidelines

```javascript
// Efficient batch processing
async function processBatchRecords(records, batchSize = 100) {
    const batches = [];
    for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
    }
    
    const results = [];
    for (const batch of batches) {
        const result = await processCreateMultiple(batch);
        results.push(result);
        
        // Add delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
}
```

### Connection Management

```csharp
// Singleton pattern for ServiceClient
public class DataverseService
{
    private static readonly Lazy<ServiceClient> _serviceClient = 
        new Lazy<ServiceClient>(() => InitializeServiceClient());
    
    public static ServiceClient Instance => _serviceClient.Value;
    
    private static ServiceClient InitializeServiceClient()
    {
        var connectionString = Environment.GetEnvironmentVariable("DATAVERSE_CONNECTION");
        var client = new ServiceClient(connectionString)
        {
            MaxRetryCount = 3,
            EnableAffinityCookie = false, // Better load distribution
            UseWebApi = true
        };
        return client;
    }
}
```

### Security Best Practices

1. **Use Application Users** for service accounts
2. **Implement least privilege** - grant minimum required permissions
3. **Store secrets securely** - use Azure Key Vault or similar
4. **Rotate credentials regularly**
5. **Enable audit logging** for compliance
6. **Use certificate authentication** for production scenarios

---

## Service Protection and Limits

### API Limits (Per User, Per Web Server)

| Limit Type | Value | Time Window |
|------------|-------|-------------|
| Number of requests | 6,000 | 5 minutes |
| Execution time | 20 minutes | 5 minutes |
| Concurrent requests | 52 | Instant |

### Handling Rate Limits

```javascript
class DataverseClient {
    constructor(baseUrl, getToken) {
        this.baseUrl = baseUrl;
        this.getToken = getToken;
        this.requestCount = 0;
        this.windowStart = Date.now();
    }
    
    async throttledRequest(url, options = {}) {
        // Simple throttling implementation
        this.requestCount++;
        const elapsed = Date.now() - this.windowStart;
        
        if (elapsed > 300000) { // 5 minutes
            this.requestCount = 1;
            this.windowStart = Date.now();
        } else if (this.requestCount > 5000) { // Stay under 6000 limit
            const waitTime = 300000 - elapsed;
            await this.sleep(waitTime);
            this.requestCount = 1;
            this.windowStart = Date.now();
        }
        
        return this.makeRequest(url, options);
    }
    
    async makeRequest(url, options = {}) {
        const token = await this.getToken();
        const response = await fetch(`${this.baseUrl}${url}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
            await this.sleep(retryAfter * 1000);
            return this.makeRequest(url, options); // Retry
        }
        
        return response;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### Performance Recommendations

1. **Use bulk operations** for large datasets (CreateMultiple, UpdateMultiple)
2. **Implement connection pooling** for high-volume scenarios
3. **Enable response compression** to reduce bandwidth
4. **Cache frequently accessed reference data**
5. **Use async/parallel processing** with proper throttling
6. **Monitor API usage** with Application Insights

---

## Code Examples

### Complete JavaScript Web API Client

```javascript
class DataverseWebApiClient {
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.getAccessToken = config.getAccessToken;
        this.maxRetries = config.maxRetries || 3;
    }
    
    async request(method, url, data = null, headers = {}) {
        const token = await this.getAccessToken();
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                'Accept': 'application/json',
                ...headers
            }
        };
        
        if (data && method !== 'GET') {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
        
        let lastError;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}${url}`, options);
                
                if (response.status === 429) {
                    const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
                    await this.sleep(retryAfter * 1000);
                    continue;
                }
                
                if (!response.ok && response.status !== 204) {
                    const error = await response.json();
                    throw new Error(error.error?.message || response.statusText);
                }
                
                if (response.status === 204) return true;
                if (method === 'POST' && response.status === 204) {
                    return response.headers.get('OData-EntityId');
                }
                
                return await response.json();
                
            } catch (error) {
                lastError = error;
                if (attempt < this.maxRetries - 1) {
                    await this.sleep(Math.pow(2, attempt) * 1000);
                }
            }
        }
        
        throw lastError;
    }
    
    create(entityName, data) {
        return this.request('POST', `/api/data/v9.2/${entityName}`, data);
    }
    
    retrieve(entityName, id, select = null, expand = null) {
        let url = `/api/data/v9.2/${entityName}(${id})`;
        const params = [];
        if (select) params.push(`$select=${select}`);
        if (expand) params.push(`$expand=${expand}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        return this.request('GET', url);
    }
    
    update(entityName, id, data) {
        return this.request('PATCH', `/api/data/v9.2/${entityName}(${id})`, data, { 'If-Match': '*' });
    }
    
    delete(entityName, id) {
        return this.request('DELETE', `/api/data/v9.2/${entityName}(${id})`);
    }
    
    retrieveMultiple(entityName, query) {
        return this.request('GET', `/api/data/v9.2/${entityName}?${query}`);
    }
    
    associate(entityName, entityId, relationship, relatedEntityName, relatedEntityId) {
        const data = {
            "@odata.id": `${this.baseUrl}/api/data/v9.2/${relatedEntityName}(${relatedEntityId})`
        };
        return this.request('POST', `/api/data/v9.2/${entityName}(${entityId})/${relationship}/$ref`, data);
    }
    
    disassociate(entityName, entityId, relationship, relatedEntityId) {
        return this.request('DELETE', `/api/data/v9.2/${entityName}(${entityId})/${relationship}(${relatedEntityId})/$ref`);
    }
    
    executeAction(actionName, data) {
        return this.request('POST', `/api/data/v9.2/${actionName}`, data);
    }
    
    batch(requests) {
        // Implementation for batch operations
        // This would construct the multipart/mixed request
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Usage
const client = new DataverseWebApiClient({
    baseUrl: 'https://yourorg.crm.dynamics.com',
    getAccessToken: async () => {
        // Your token acquisition logic
        return await getToken();
    }
});

// Create a contact
const contactId = await client.create('contacts', {
    firstname: 'John',
    lastname: 'Doe',
    emailaddress1: 'john.doe@example.com'
});

// Retrieve the contact
const contact = await client.retrieve('contacts', contactId, 'fullname,emailaddress1');

// Update the contact
await client.update('contacts', contactId, {
    telephone1: '555-0100'
});

// Query contacts
const contacts = await client.retrieveMultiple('contacts', 
    '$select=fullname,emailaddress1&$filter=statecode eq 0&$top=10'
);
```

### Complete C# SDK Client

```csharp
using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Polly;
using System;
using System.Threading.Tasks;

public class DataverseService : IDataverseService
{
    private readonly ServiceClient _serviceClient;
    private readonly IAsyncPolicy _retryPolicy;
    
    public DataverseService(string connectionString)
    {
        _serviceClient = new ServiceClient(connectionString)
        {
            MaxRetryCount = 3,
            EnableAffinityCookie = false,
            UseWebApi = true
        };
        
        _retryPolicy = Policy
            .Handle<Exception>()
            .WaitAndRetryAsync(
                3,
                retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (exception, timespan, retryCount, context) =>
                {
                    Console.WriteLine($"Retry {retryCount} after {timespan} seconds");
                });
    }
    
    public async Task<Guid> CreateAsync(Entity entity)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            return await _serviceClient.CreateAsync(entity);
        });
    }
    
    public async Task<Entity> RetrieveAsync(string entityName, Guid id, ColumnSet columns)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            return await _serviceClient.RetrieveAsync(entityName, id, columns);
        });
    }
    
    public async Task UpdateAsync(Entity entity)
    {
        await _retryPolicy.ExecuteAsync(async () =>
        {
            await _serviceClient.UpdateAsync(entity);
        });
    }
    
    public async Task DeleteAsync(string entityName, Guid id)
    {
        await _retryPolicy.ExecuteAsync(async () =>
        {
            await _serviceClient.DeleteAsync(entityName, id);
        });
    }
    
    public async Task<EntityCollection> RetrieveMultipleAsync(QueryBase query)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            return await _serviceClient.RetrieveMultipleAsync(query);
        });
    }
    
    public async Task<EntityCollection> RetrieveMultipleWithPagingAsync(QueryExpression query)
    {
        var allRecords = new EntityCollection();
        query.PageInfo = new PagingInfo
        {
            Count = 5000,
            PageNumber = 1,
            PagingCookie = null
        };
        
        while (true)
        {
            var response = await RetrieveMultipleAsync(query);
            allRecords.Entities.AddRange(response.Entities);
            
            if (response.MoreRecords)
            {
                query.PageInfo.PageNumber++;
                query.PageInfo.PagingCookie = response.PagingCookie;
            }
            else
            {
                break;
            }
        }
        
        return allRecords;
    }
    
    public async Task AssociateAsync(string entityName, Guid entityId, 
        Relationship relationship, EntityReferenceCollection relatedEntities)
    {
        await _retryPolicy.ExecuteAsync(async () =>
        {
            await _serviceClient.AssociateAsync(entityName, entityId, relationship, relatedEntities);
        });
    }
    
    public async Task DisassociateAsync(string entityName, Guid entityId, 
        Relationship relationship, EntityReferenceCollection relatedEntities)
    {
        await _retryPolicy.ExecuteAsync(async () =>
        {
            await _serviceClient.DisassociateAsync(entityName, entityId, relationship, relatedEntities);
        });
    }
    
    public void Dispose()
    {
        _serviceClient?.Dispose();
    }
}

// Usage example
public class ContactManager
{
    private readonly IDataverseService _dataverseService;
    
    public ContactManager(IDataverseService dataverseService)
    {
        _dataverseService = dataverseService;
    }
    
    public async Task<Guid> CreateContactAsync(string firstName, string lastName, string email)
    {
        var contact = new Entity("contact");
        contact["firstname"] = firstName;
        contact["lastname"] = lastName;
        contact["emailaddress1"] = email;
        
        return await _dataverseService.CreateAsync(contact);
    }
    
    public async Task<Entity> GetContactAsync(Guid contactId)
    {
        var columns = new ColumnSet("firstname", "lastname", "emailaddress1", "telephone1");
        return await _dataverseService.RetrieveAsync("contact", contactId, columns);
    }
    
    public async Task UpdateContactPhoneAsync(Guid contactId, string phoneNumber)
    {
        var contact = new Entity("contact", contactId);
        contact["telephone1"] = phoneNumber;
        
        await _dataverseService.UpdateAsync(contact);
    }
    
    public async Task<EntityCollection> SearchContactsAsync(string searchTerm)
    {
        var query = new QueryExpression("contact")
        {
            ColumnSet = new ColumnSet("fullname", "emailaddress1"),
            Criteria = new FilterExpression(LogicalOperator.Or)
        };
        
        query.Criteria.AddCondition("firstname", ConditionOperator.Contains, searchTerm);
        query.Criteria.AddCondition("lastname", ConditionOperator.Contains, searchTerm);
        query.Criteria.AddCondition("emailaddress1", ConditionOperator.Contains, searchTerm);
        
        return await _dataverseService.RetrieveMultipleAsync(query);
    }
}
```

### Python Implementation

```python
import requests
import json
from typing import Dict, List, Optional
from time import sleep
import logging

class DataverseClient:
    def __init__(self, base_url: str, get_access_token):
        self.base_url = base_url
        self.get_access_token = get_access_token
        self.session = requests.Session()
        self.logger = logging.getLogger(__name__)
        
    def _get_headers(self, additional_headers: Dict = None) -> Dict:
        headers = {
            'Authorization': f'Bearer {self.get_access_token()}',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        if additional_headers:
            headers.update(additional_headers)
        return headers
    
    def _handle_response(self, response: requests.Response):
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 5))
            self.logger.warning(f"Rate limited. Retrying after {retry_after} seconds")
            sleep(retry_after)
            return None  # Signal retry needed
            
        if response.status_code == 204:
            return True
            
        if response.status_code in [200, 201]:
            return response.json() if response.text else True
            
        try:
            error = response.json()
            raise Exception(f"API Error: {error.get('error', {}).get('message', 'Unknown error')}")
        except json.JSONDecodeError:
            response.raise_for_status()
    
    def create(self, entity_name: str, data: Dict) -> str:
        """Create a new record"""
        url = f"{self.base_url}/api/data/v9.2/{entity_name}"
        max_retries = 3
        
        for attempt in range(max_retries):
            response = self.session.post(url, json=data, headers=self._get_headers())
            result = self._handle_response(response)
            
            if result is None:  # Retry needed
                continue
                
            if response.status_code == 204:
                entity_id = response.headers.get('OData-EntityId')
                return entity_id.split('(')[1].split(')')[0]
                
        raise Exception(f"Failed to create {entity_name} after {max_retries} attempts")
    
    def retrieve(self, entity_name: str, record_id: str, 
                 select: Optional[List[str]] = None, 
                 expand: Optional[str] = None) -> Dict:
        """Retrieve a single record"""
        url = f"{self.base_url}/api/data/v9.2/{entity_name}({record_id})"
        params = {}
        
        if select:
            params['$select'] = ','.join(select)
        if expand:
            params['$expand'] = expand
            
        response = self.session.get(url, params=params, headers=self._get_headers())
        return self._handle_response(response)
    
    def update(self, entity_name: str, record_id: str, data: Dict) -> bool:
        """Update an existing record"""
        url = f"{self.base_url}/api/data/v9.2/{entity_name}({record_id})"
        headers = self._get_headers({'If-Match': '*'})
        
        response = self.session.patch(url, json=data, headers=headers)
        return self._handle_response(response)
    
    def delete(self, entity_name: str, record_id: str) -> bool:
        """Delete a record"""
        url = f"{self.base_url}/api/data/v9.2/{entity_name}({record_id})"
        response = self.session.delete(url, headers=self._get_headers())
        return self._handle_response(response)
    
    def retrieve_multiple(self, entity_name: str, 
                         filter: Optional[str] = None,
                         select: Optional[List[str]] = None,
                         orderby: Optional[str] = None,
                         top: Optional[int] = None) -> List[Dict]:
        """Retrieve multiple records with OData query"""
        url = f"{self.base_url}/api/data/v9.2/{entity_name}"
        params = {}
        
        if filter:
            params['$filter'] = filter
        if select:
            params['$select'] = ','.join(select)
        if orderby:
            params['$orderby'] = orderby
        if top:
            params['$top'] = top
            
        all_records = []
        
        while url:
            response = self.session.get(url, params=params, headers=self._get_headers())
            result = self._handle_response(response)
            
            all_records.extend(result.get('value', []))
            url = result.get('@odata.nextLink')
            params = {}  # Clear params for pagination
            
        return all_records
    
    def execute_action(self, action_name: str, data: Dict) -> Dict:
        """Execute a custom action or function"""
        url = f"{self.base_url}/api/data/v9.2/{action_name}"
        response = self.session.post(url, json=data, headers=self._get_headers())
        return self._handle_response(response)

# Usage example
def get_token():
    # Your token acquisition logic here
    return "your_access_token"

client = DataverseClient('https://yourorg.crm.dynamics.com', get_token)

# Create a contact
contact_id = client.create('contacts', {
    'firstname': 'Jane',
    'lastname': 'Smith',
    'emailaddress1': 'jane.smith@example.com'
})

# Retrieve the contact
contact = client.retrieve('contacts', contact_id, 
                         select=['fullname', 'emailaddress1', 'telephone1'])

# Update the contact
client.update('contacts', contact_id, {
    'telephone1': '555-0200',
    'jobtitle': 'Manager'
})

# Query contacts
contacts = client.retrieve_multiple(
    'contacts',
    filter="statecode eq 0 and contains(fullname,'Smith')",
    select=['fullname', 'emailaddress1'],
    orderby='createdon desc',
    top=10
)

# Delete the contact
client.delete('contacts', contact_id)
```

---

## Official Documentation Links

### Core Documentation
- **Web API Overview**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview
- **Authentication**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/authenticate-oauth
- **Web API Reference**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/

### CRUD Operations
- **Create Operations**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/create-entity-web-api
- **Retrieve Operations**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/retrieve-entity-using-web-api
- **Update/Delete Operations**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/update-delete-entities-using-web-api
- **Upsert Operations**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/use-upsert-insert-update-record

### Query and Filtering
- **Query Data using OData**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/overview
- **Filter Rows**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/filter-rows
- **FetchXML Reference**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/fetchxml/overview

### Advanced Topics
- **Batch Operations**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/execute-batch-operations-using-web-api
- **Associate/Disassociate**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/associate-disassociate-entities-using-web-api
- **Bulk Operations**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/bulk-operations
- **Service Protection Limits**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/api-limits

### SDK Documentation
- **SDK for .NET**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/org-service/overview
- **ServiceClient Class**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/xrm-tooling/use-xrm-tooling-common-login-control-client-applications

### Samples and Tools
- **Web API Samples**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/web-api-samples
- **PowerApps-Samples GitHub**: https://github.com/microsoft/PowerApps-Samples
- **Dataverse REST Builder**: https://github.com/GuidoPreite/DRB
- **XrmToolBox**: https://www.xrmtoolbox.com/

### Community Resources
- **Power Platform Community**: https://powerusers.microsoft.com/
- **Power CAT Team Blog**: https://powerapps.microsoft.com/en-us/blog/
- **Dataverse Developer Guide**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/

This documentation provides a comprehensive guide for performing CRUD operations with Microsoft Dataverse API, suitable for use with Claude Code for development. It includes detailed examples in multiple programming languages, proper error handling patterns, performance optimization techniques, and links to official Microsoft documentation for further reference.
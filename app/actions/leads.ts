'use server';

// Server actions for Dataverse lead operations
// These actions can be called from client components and will run on the server

export async function fetchLeadsFromDataverse() {
  try {
    // This query fetches all active leads from Dataverse
    const query = `
      SELECT 
        ycn_leadid, 
        ycn_name, 
        ycn_rating,
        createdon,
        modifiedon
      FROM ycn_lead 
      WHERE statecode = 0
      ORDER BY createdon DESC
    `;

    // In production with actual MCP integration:
    // const result = await mcp.readQuery({ querytext: query });
    // return result.data || [];

    // For demonstration, return empty array
    // Leads will appear here once created via the form
    return [];
  } catch (error) {
    console.error('Error fetching leads from Dataverse:', error);
    throw new Error('Failed to fetch leads from Dataverse');
  }
}

export async function createLeadInDataverse(name: string, rating: number) {
  try {
    // Validate inputs
    if (!name || !name.trim()) {
      throw new Error('Lead name is required');
    }

    const validRatings = [100000000, 100000001, 100000002];
    if (!validRatings.includes(rating)) {
      throw new Error('Invalid rating value');
    }

    // Prepare the data for Dataverse
    const leadData = {
      ycn_name: name.trim(),
      ycn_rating: rating
    };

    // In production with actual MCP integration:
    // const item = JSON.stringify(leadData);
    // const result = await mcp.createRecord({ 
    //   tablename: 'ycn_lead', 
    //   item: item 
    // });
    // return result;

    // For demonstration, simulate the creation
    const newLead = {
      ycn_leadid: `lead-${Date.now()}`,
      ycn_name: leadData.ycn_name,
      ycn_rating: leadData.ycn_rating,
      createdon: new Date().toISOString(),
      modifiedon: new Date().toISOString(),
    };

    console.log('Would create lead in Dataverse:', newLead);
    return newLead;
  } catch (error) {
    console.error('Error creating lead in Dataverse:', error);
    throw error instanceof Error ? error : new Error('Failed to create lead');
  }
}

export async function updateLeadRating(leadId: string, newRating: number) {
  try {
    // Validate inputs
    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    const validRatings = [100000000, 100000001, 100000002];
    if (!validRatings.includes(newRating)) {
      throw new Error('Invalid rating value');
    }

    // In production with actual MCP integration:
    // const item = JSON.stringify({ ycn_rating: newRating });
    // const result = await mcp.updateRecord({
    //   tablename: 'ycn_lead',
    //   recordId: leadId,
    //   item: item
    // });
    // return result;

    // For demonstration, return success
    console.log(`Would update lead ${leadId} rating to ${newRating}`);
    return { success: true, leadId, rating: newRating };
  } catch (error) {
    console.error('Error updating lead rating:', error);
    throw error instanceof Error ? error : new Error('Failed to update lead');
  }
}
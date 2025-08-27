import { NextRequest, NextResponse } from 'next/server';

// This route demonstrates how to integrate with Dataverse MCP server
// In production, you would call the MCP server from your backend

export async function GET(request: NextRequest) {
  try {
    // Query to fetch all active leads from Dataverse
    const query = `
      SELECT 
        ycn_leadid, 
        ycn_name, 
        ycn_rating,
        _ownerid_value,
        createdon,
        modifiedon
      FROM ycn_lead 
      WHERE statecode = 0
      ORDER BY createdon DESC
    `;

    // In production with MCP server integration:
    // const mcpClient = getMCPClient();
    // const result = await mcpClient.call('mcp__AI-CRM__read_query', { 
    //   querytext: query 
    // });

    // For demonstration, returning sample data
    const sampleResult = {
      value: [
        {
          ycn_leadid: '1',
          ycn_name: 'Acme Corporation',
          ycn_rating: 100000000, // Cold
          _ownerid_value: 'user1',
          createdon: '2024-01-15T10:00:00Z',
          modifiedon: '2024-01-15T10:00:00Z',
        },
        {
          ycn_leadid: '2',
          ycn_name: 'TechStart Inc.',
          ycn_rating: 100000001, // Warm
          _ownerid_value: 'user1',
          createdon: '2024-01-16T10:00:00Z',
          modifiedon: '2024-01-16T10:00:00Z',
        },
        {
          ycn_leadid: '3',
          ycn_name: 'Global Solutions Ltd.',
          ycn_rating: 100000002, // Hot
          _ownerid_value: 'user2',
          createdon: '2024-01-17T10:00:00Z',
          modifiedon: '2024-01-17T10:00:00Z',
        },
      ]
    };

    return NextResponse.json(sampleResult.value);
  } catch (error) {
    console.error('Error fetching leads from Dataverse:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads from Dataverse' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { leadId, rating } = await request.json();

    if (!leadId || !rating) {
      return NextResponse.json(
        { error: 'Lead ID and rating are required' },
        { status: 400 }
      );
    }

    // In production with MCP server:
    // const mcpClient = getMCPClient();
    // const result = await mcpClient.call('mcp__AI-CRM__update_record', {
    //   tablename: 'ycn_lead',
    //   recordId: leadId,
    //   item: JSON.stringify({ ycn_rating: rating })
    // });

    return NextResponse.json({
      success: true,
      leadId,
      rating,
    });
  } catch (error) {
    console.error('Error updating lead in Dataverse:', error);
    return NextResponse.json(
      { error: 'Failed to update lead in Dataverse' },
      { status: 500 }
    );
  }
}
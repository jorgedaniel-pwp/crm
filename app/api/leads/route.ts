import { NextRequest, NextResponse } from 'next/server';
import DataverseClient from '@/lib/dataverse-client';

export async function GET(request: NextRequest) {
  try {
    // Extract the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Create Dataverse client with user's token
    const client = new DataverseClient(accessToken);
    
    // Fetch leads using user's permissions
    const leads = await client.getLeads();
    
    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Error fetching leads from Dataverse:', error);
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch leads from Dataverse' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const body = await request.json();
    const { ycn_name, ycn_rating } = body;

    if (!ycn_name || !ycn_name.trim()) {
      return NextResponse.json(
        { error: 'Lead name is required' },
        { status: 400 }
      );
    }

    // Create Dataverse client with user's token
    const client = new DataverseClient(accessToken);
    
    // Create lead in Dataverse
    const leadId = await client.createLead({
      ycn_name: ycn_name.trim(),
      ycn_rating: ycn_rating || 100000001 // Default to Warm
    });
    
    // Return the created lead
    const newLead = {
      ycn_leadid: leadId,
      ycn_name: ycn_name.trim(),
      ycn_rating: ycn_rating || 100000001,
      createdon: new Date().toISOString(),
      modifiedon: new Date().toISOString(),
    };

    return NextResponse.json(newLead, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead in Dataverse:', error);
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create lead in Dataverse' },
      { status: 500 }
    );
  }
}
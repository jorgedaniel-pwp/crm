import { NextRequest, NextResponse } from 'next/server';
import DataverseClient from '@/lib/dataverse-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API] PATCH /api/leads/[id] - Lead ID:', params.id);
  
  try {
    // Extract the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[API] No authorization token provided');
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const body = await request.json();
    const { rating } = body;
    
    console.log('[API] Update request:', { leadId: params.id, rating });

    if (!rating) {
      console.log('[API] Rating is missing');
      return NextResponse.json(
        { error: 'Rating is required' },
        { status: 400 }
      );
    }

    // Create Dataverse client with user's token
    const client = new DataverseClient(accessToken);
    
    console.log('[API] Calling Dataverse updateLead...');
    
    // Update the lead in Dataverse
    await client.updateLead(params.id, {
      ycn_rating: rating
    });
    
    console.log('[API] Dataverse update successful');

    return NextResponse.json({
      success: true,
      id: params.id,
      rating: rating,
    });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Create Dataverse client with user's token
    const client = new DataverseClient(accessToken);
    
    // Delete the lead from Dataverse
    await client.deleteLead(params.id);

    return NextResponse.json({
      success: true,
      id: params.id,
    });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
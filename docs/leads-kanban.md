# Leads Kanban Board

## Overview
The Leads Kanban Board provides a visual pipeline for managing leads through different stages based on their rating (Cold, Warm, Hot). Users can drag and drop leads between columns to update their ratings.

## Features
- Visual kanban board with three columns: Cold, Warm, Hot
- Drag and drop functionality to move leads between stages
- Real-time count of leads in each stage
- Display of lead details including name, owner, and modification date
- Integration with Dataverse Lead table (ycn_lead)

## Data Structure
The kanban board uses the following Dataverse Lead table fields:
- `ycn_leadid`: Unique identifier for the lead
- `ycn_name`: Name of the lead
- `ycn_rating`: Rating value (100000000=Cold, 100000001=Warm, 100000002=Hot)
- `_ownerid_value`: Owner of the lead
- `createdon`: Creation timestamp
- `modifiedon`: Last modification timestamp

## API Endpoints

### GET /api/leads
Fetches all active leads from the Dataverse Lead table.

### PATCH /api/leads/[id]
Updates a lead's rating when dragged to a new column.

## Dataverse Integration
The application is configured to work with the Dataverse MCP server. In production:
1. The API routes would connect to the MCP server
2. Use `mcp__AI-CRM__read_query` to fetch leads
3. Use `mcp__AI-CRM__update_record` to update lead ratings

## Usage
1. Navigate to `/leads` in the application
2. View leads organized by their rating status
3. Drag leads between columns to update their rating
4. The system automatically saves changes to Dataverse

## Configuration
To connect to your Dataverse instance:
1. Ensure the MCP server is configured with your Dataverse credentials
2. Update the API routes to use the actual MCP client
3. Verify the `ycn_lead` table exists with the required fields
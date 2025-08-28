# Dataverse User Authentication Setup

## Overview
This application uses Microsoft Authentication (MSAL) to allow users to sign in with their organizational accounts and access Dataverse data based on their permissions. No mock data is used - users see real data from Dataverse.

## Prerequisites

1. **Azure AD App Registration**
   - You need ONE Azure AD app registration (not for credentials, but to enable user login)
   - This app will have delegated permissions to access Dataverse on behalf of users

## Setup Instructions

### 1. Create Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure the app:
   - **Name**: Your app name (e.g., "CRM Dataverse App")
   - **Supported account types**: Select based on your needs:
     - Single tenant (your organization only)
     - Multi-tenant (any organization)
   - **Redirect URI**: 
     - Platform: **Single-page application**
     - URI: `http://localhost:3000` (for development)
     - Add your production URL later

### 2. Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Choose **Dynamics CRM**
4. Select **Delegated permissions**
5. Add the permission: `user_impersonation`
6. Click **Grant admin consent** (if you're an admin)

### 3. Configure the Application

1. Copy your `.env.example` to `.env.local`
2. Update the values:
   ```env
   NEXT_PUBLIC_AZURE_CLIENT_ID=<your-app-client-id>
   NEXT_PUBLIC_AZURE_TENANT_ID=<your-tenant-id>
   NEXT_PUBLIC_DATAVERSE_URL=<your-dataverse-url>
   ```

3. Find these values:
   - **Client ID**: In your app registration overview page
   - **Tenant ID**: In your app registration overview page
   - **Dataverse URL**: Your Dataverse environment URL (e.g., `https://yourorg.crm.dynamics.com`)

### 4. Important: Redirect URIs

For production deployment, remember to:
1. Add your production URL to the app registration's redirect URIs
2. Update the redirect URI configuration in the app if needed

## How It Works

1. **User signs in** with their Microsoft account via popup
2. **App receives token** that represents the user
3. **API calls include token** to access Dataverse with user's permissions
4. **User sees their data** - only what they have access to in Dataverse

## Security Benefits

- ✅ No credentials stored in the app
- ✅ Users only see data they have permission to access
- ✅ Standard Microsoft authentication experience
- ✅ Automatic token refresh
- ✅ Session-based authentication

## User Experience

1. When users visit `/leads`, they'll see a sign-in prompt
2. Clicking "Sign in with Microsoft" opens a popup
3. After signing in, they see their Dataverse leads
4. The app automatically refreshes tokens as needed
5. Users can sign out when done

## Troubleshooting

### "No authorization token provided" error
- User needs to sign in first
- Token may have expired - sign in again

### "Authentication failed" error
- Check that the user has access to Dataverse
- Verify API permissions are granted
- Ensure redirect URI matches current URL

### Popup blocked
- Enable popups for the site
- Or configure redirect flow instead of popup

## Testing

1. Run the development server: `npm run dev`
2. Navigate to `http://localhost:3000/leads`
3. Click "Sign in with Microsoft"
4. Sign in with an account that has Dataverse access
5. You should see your actual Dataverse leads

## Next Steps

- Add role-based access control
- Implement token caching for better performance
- Add user profile management
- Consider adding offline support
# Google Maps API Setup Guide

This guide will walk you through getting a Google Maps API key for geofencing functionality.

## Step 1: Create a Google Cloud Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (or create one if needed)
3. Accept the terms of service if prompted

## Step 2: Create a New Project

1. Click on the project dropdown at the top of the page (next to "Google Cloud")
2. Click **"New Project"**
3. Enter a project name (e.g., "Pluming Eagle Management")
4. Optionally select an organization
5. Click **"Create"**
6. Wait for the project to be created (may take a few seconds)
7. Select your new project from the dropdown

## Step 3: Enable Billing (Required)

⚠️ **Important**: Google Maps Platform requires billing, but you get $200/month in free credits!

1. In the left sidebar, go to **"Billing"**
2. Click **"Link a billing account"**
3. Click **"Create billing account"** (if you don't have one)
4. Fill in your billing information:
   - Account name
   - Country
   - Currency
   - Payment method (credit card)
5. Click **"Submit and enable billing"**

**Note**: Google provides $200/month in free credits, which covers:
- ~28,000 map loads per month
- ~40,000 geocoding requests per month
- Most small to medium applications won't exceed this

## Step 4: Enable Required APIs

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. Search for and enable these APIs (click on each, then click "Enable"):

   **Required APIs:**
   - **Maps JavaScript API** - For displaying maps
   - **Geocoding API** - For converting addresses to coordinates (already used in your app)
   - **Places API** (optional) - If you want to use Google Places features

3. Wait for each API to be enabled (you'll see a checkmark when done)

## Step 5: Create an API Key

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be created and displayed in a popup
5. **Copy the API key** - you'll need it in the next step
6. Click **"Close"** (don't restrict it yet - we'll do that next)

## Step 6: Restrict Your API Key (Security Best Practice)

⚠️ **Important**: Restricting your API key prevents unauthorized usage and potential charges.

1. In the **"Credentials"** page, click on your newly created API key
2. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Click **"Add an item"**
   - Add your domains:
     - For development: `http://localhost:3000/*`
     - For production: `https://yourdomain.com/*`
     - For Vercel: `https://*.vercel.app/*` (if using Vercel)
   - Example:
     ```
     http://localhost:3000/*
     https://yourdomain.com/*
     https://*.vercel.app/*
     ```

3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check only the APIs you enabled:
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
     - ✅ Places API (if you enabled it)
   - Click **"Save"**

## Step 7: Add API Key to Your Project

1. Open your project's `.env` file (or create one from `env.example`)
2. Add the following line:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   ```
   Replace `YOUR_API_KEY_HERE` with the actual API key you copied

3. **Important**: 
   - Never commit your `.env` file to Git (it should already be in `.gitignore`)
   - For production (Vercel), add this as an environment variable in your deployment settings

## Step 8: Restart Your Development Server

1. Stop your current development server (Ctrl+C)
2. Start it again:
   ```bash
   npm start
   ```
   or
   ```bash
   yarn start
   ```

## Step 9: Verify It's Working

1. Navigate to the Facility Management page
2. Try editing a facility and setting a geofencing address
3. You should see a map appear with the location
4. Check the browser console for any errors

## Troubleshooting

### "This API key is not authorized"
- Make sure you've enabled the required APIs (Step 4)
- Check that your API key restrictions allow your domain

### "RefererNotAllowedMapError"
- Check your HTTP referrer restrictions in Step 6
- Make sure `http://localhost:3000/*` is included for development

### "Billing not enabled"
- Make sure you've completed Step 3 (Enable Billing)
- Even with free credits, billing must be enabled

### Map not showing
- Check browser console for errors
- Verify the API key is correctly set in `.env`
- Make sure you restarted the development server after adding the key

## Cost Management

### Monitor Your Usage
1. Go to **"APIs & Services"** > **"Dashboard"**
2. View your API usage and costs
3. Set up billing alerts:
   - Go to **"Billing"** > **"Budgets & alerts"**
   - Create a budget to get notified if you approach your limit

### Free Tier Limits (with $200 credit)
- Maps JavaScript API: ~28,000 loads/month
- Geocoding API: ~40,000 requests/month
- Most small applications stay within free tier

### If You Exceed Free Tier
- You'll be charged per request (very small amounts)
- Typical cost: $0.007 per map load, $0.005 per geocoding request
- Set up billing alerts to monitor usage

## Security Best Practices

1. ✅ **Always restrict your API key** (Step 6)
2. ✅ **Never commit API keys to Git**
3. ✅ **Use different keys for development and production**
4. ✅ **Rotate keys if compromised**
5. ✅ **Monitor usage regularly**

## Next Steps

Once your API key is set up:
1. The geofencing map in Facility Management will work automatically
2. Employee location detection will use the geofencing coordinates
3. The "My Reports" page will filter by geofenced facility

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Pricing Information](https://developers.google.com/maps/billing-and-pricing/pricing)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)


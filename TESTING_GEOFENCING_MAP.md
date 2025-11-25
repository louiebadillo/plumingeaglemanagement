# Testing Geofencing Map - Step by Step

## ✅ Step 1: Verify .env File

Your `.env` file should contain:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Important**: Make sure there are no spaces around the `=` sign and no quotes around the key.

## ✅ Step 2: Restart Development Server

**CRITICAL**: Environment variables are only loaded when the server starts!

1. **Stop your current development server** (if running):
   - Press `Ctrl + C` in the terminal where it's running

2. **Start it again**:
   ```bash
   npm start
   ```
   or
   ```bash
   yarn start
   ```

3. Wait for the app to compile and open in your browser

## ✅ Step 3: Test the Geofencing Map

### Test Location: Facility Management Page

1. **Navigate to Facility Management**:
   - Go to: `http://localhost:3000/app/facility/management`
   - Or click "Facility Management" in the sidebar (admin only)

2. **Edit an Existing Facility** (or create a new one):
   - Click the "Edit" button (pencil icon) on any facility
   - Or click "Add Facility" to create a new one

3. **Set Geofencing Address**:
   - Scroll down to the "Geofencing Settings" section
   - Enter an address in the "Geofencing Address" field
   - Example addresses to test:
     - `1600 Amphitheatre Parkway, Mountain View, CA` (Google HQ)
     - `123 Main Street, New York, NY`
     - Any real address you know

4. **Click "Set Geofencing"**:
   - The app will geocode the address (convert to coordinates)
   - You should see a loading indicator
   - After a few seconds, the map should appear below

5. **Verify the Map**:
   - ✅ You should see a Google Map with a marker
   - ✅ A blue circle showing the geofence radius
   - ✅ The marker should be draggable (you can move it)
   - ✅ The map should be interactive (zoom, pan)

## ✅ Step 4: Test Map Interactions

1. **Drag the Marker**:
   - Click and drag the red marker
   - The coordinates should update automatically
   - The blue circle should move with the marker

2. **Adjust Radius**:
   - Change the "Geofencing Radius (meters)" value
   - The blue circle should resize on the map

3. **Save the Facility**:
   - Click "Save" to save the facility with geofencing coordinates
   - The coordinates should be saved to the database

## ✅ Step 5: Check Browser Console

Open browser DevTools (F12 or Cmd+Option+I) and check:

1. **No Errors**:
   - Should see no red errors related to Google Maps
   - If you see "RefererNotAllowedMapError", you need to add `http://localhost:3000/*` to your API key restrictions

2. **API Loading**:
   - Check the Network tab
   - You should see requests to `maps.googleapis.com`
   - Status should be 200 (success)

## 🐛 Troubleshooting

### Map Not Showing

**Issue**: Map doesn't appear, shows "Loading map..." forever

**Solutions**:
1. ✅ Check `.env` file has the correct key (no quotes, no spaces)
2. ✅ Restart the development server
3. ✅ Check browser console for errors
4. ✅ Verify API key is enabled in Google Cloud Console
5. ✅ Check that Maps JavaScript API is enabled

### "RefererNotAllowedMapError"

**Issue**: Console shows this error

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Credentials
3. Click on your API key
4. Under "Application restrictions" → "HTTP referrers"
5. Add: `http://localhost:3000/*`
6. Click "Save"
7. Wait 1-2 minutes for changes to propagate
8. Refresh your browser

### "This API key is not authorized"

**Issue**: Console shows authorization error

**Solution**:
1. Go to Google Cloud Console
2. Navigate to: APIs & Services → Library
3. Make sure these are enabled:
   - ✅ Maps JavaScript API
   - ✅ Geocoding API
4. Wait a few minutes and refresh

### Map Shows but No Marker

**Issue**: Map loads but marker/circle don't appear

**Solution**:
- This is normal if no coordinates are set yet
- Set a geofencing address first
- The marker appears after geocoding succeeds

## ✅ Step 6: Test Geofencing Detection (Optional)

Once the map is working, you can test employee location detection:

1. **Set up a facility with geofencing** (using the map)
2. **Go to Dashboard** (as an employee)
3. **Allow location permission** when prompted
4. **Check if facility is detected** based on your location

## 📝 What to Check Before Deploying to Vercel

Before pushing to Vercel, make sure:

1. ✅ Map works locally
2. ✅ No console errors
3. ✅ API key is restricted (for security)
4. ✅ You have the API key ready to add to Vercel environment variables

## 🚀 Next Steps After Testing

Once everything works locally:

1. **Add API key to Vercel**:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `REACT_APP_GOOGLE_MAPS_API_KEY` = `your_key_here`
   - Make sure to add it for "Production", "Preview", and "Development"

2. **Update API Key Restrictions**:
   - Add your Vercel domain to HTTP referrers:
     - `https://your-project.vercel.app/*`
     - `https://*.vercel.app/*` (if using preview deployments)

3. **Deploy and Test**:
   - Push your changes
   - Test the map on the deployed version

## 🎯 Success Criteria

You'll know it's working when:
- ✅ Map loads without errors
- ✅ Marker appears at the geocoded address
- ✅ Blue circle shows the geofence radius
- ✅ You can drag the marker to adjust location
- ✅ Coordinates update when you drag
- ✅ Facility saves with geofencing data

Good luck! 🗺️


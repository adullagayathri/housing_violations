require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json());

let accessToken = null;
let instanceUrl = null;

// ===== Fetch Salesforce Token =====
async function fetchSalesforceToken() {
  const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.SF_CONSUMER_KEY,
    client_secret: process.env.SF_CONSUMER_SECRET,
  });

  try {
    const response = await axios.post(
      'https://login.salesforce.com/services/oauth2/token',
      data,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    accessToken = response.data.access_token;
    instanceUrl = response.data.instance_url;

    console.log('✅ Salesforce token fetched');
  } catch (err) {
    console.error('❌ Error fetching Salesforce token:', err.response?.data || err.message);
  }
}

// Fetch token on startup
fetchSalesforceToken();

// Refresh token every 55 mins
setInterval(fetchSalesforceToken, 55 * 60 * 1000);

// ===== Save JSON + Image Endpoint =====
app.post('/save', async (req, res) => {
  const payload = req.body;

  if (!payload || !payload.image_id || !payload.annotations || !payload.image_data) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  if (!accessToken || !instanceUrl) {
    return res.status(500).json({ success: false, error: "Salesforce not authenticated yet" });
  }

  try {
    // --- 1. Upload Image to Salesforce ContentVersion ---
    const contentResponse = await axios.post(
      `${instanceUrl}/services/data/v58.0/sobjects/ContentVersion`,
      {
        Title: payload.image_id,
        PathOnClient: payload.image_id,
        VersionData: payload.image_data, // base64 image
        FirstPublishLocationId: process.env.SF_LIBRARY_ID
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    const contentVersionId = contentResponse.data.id;
    console.log('✅ Image uploaded:', contentVersionId);

    // --- 2. Save JSON record linked to image ---
    const sfPayload = {
      Name: payload.image_id,
      JSON_Data__c: JSON.stringify({ annotations: payload.annotations }),
      Image_Name__c: payload.image_id,
      Uploaded_At__c: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      Content_Version_Id__c: contentVersionId // link to uploaded image
    };

    const sfResponse = await axios.post(
      `${instanceUrl}/services/data/v58.0/sobjects/Housing_Data_Image__c/`,
      sfPayload,
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    console.log('✅ JSON + Image record saved:', sfResponse.data.id);

    res.json({ success: true, sfId: sfResponse.data.id });

  } catch (err) {
    console.error('❌ Salesforce Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

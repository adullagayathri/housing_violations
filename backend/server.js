require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json());

// ===== Salesforce Auth Variables =====
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
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
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

// ===== API Endpoint =====
app.post('/save', async (req, res) => {
  const payload = req.body;

  if (!payload || !payload.image_id || !payload.annotations || !payload.image_base64) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  try {
    if (!accessToken || !instanceUrl) {
      return res.status(500).json({ success: false, error: "Salesforce not authenticated yet" });
    }

    // ===== 1️⃣ Save JSON as a record =====
    const sfUrl = `${instanceUrl}/services/data/v58.0/sobjects/Violation__c/`;
    const salesforcePayload = {
      Name: `Housing Image ${payload.image_id}`,
      JSON_Data__c: JSON.stringify({
        image_id: payload.image_id,
        annotations: payload.annotations,
      }),
      Image_Name__c: payload.image_id,
      Uploaded_At__c: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    };

    const recordResponse = await axios.post(sfUrl, salesforcePayload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    const recordId = recordResponse.data.id;
    console.log("✅ JSON saved to Salesforce:", recordId);

    // ===== 2️⃣ Upload annotated image to Salesforce library =====
    const contentUrl = `${instanceUrl}/services/data/v58.0/sobjects/ContentVersion/`;
    const imagePayload = {
      Title: payload.image_id,
      PathOnClient: `${payload.image_id}.png`,
      VersionData: payload.image_base64, // base64 string
      FirstPublishLocationId: process.env.SF_LIBRARY_ID, // library folder
    };

    const imageResponse = await axios.post(contentUrl, imagePayload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    console.log("✅ Image saved to Salesforce library:", imageResponse.data.id);

    res.json({ success: true, sfRecordId: recordId, sfImageId: imageResponse.data.id });
  } catch (err) {
    console.error("❌ Salesforce Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

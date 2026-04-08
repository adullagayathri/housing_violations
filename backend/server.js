require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // handle large base64 images

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

fetchSalesforceToken();
setInterval(fetchSalesforceToken, 55 * 60 * 1000); // refresh every 55 mins

// ===== Upload Image to Salesforce Library =====
async function uploadImageToLibrary(imageBase64, filename) {
  const form = new FormData();
  const buffer = Buffer.from(imageBase64.split(',')[1], 'base64'); // remove prefix if exists
  form.append('VersionData', buffer, filename);
  form.append('PathOnClient', filename);
  form.append('LibraryId', process.env.SF_LIBRARY_ID);

  const url = `${instanceUrl}/services/data/v58.0/sobjects/ContentVersion`;

  const response = await axios.post(url, form, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...form.getHeaders(),
    },
  });

  // Get ContentDocumentId for linking
  return response.data.ContentDocumentId;
}

// ===== API Endpoint =====
app.post('/save', async (req, res) => {
  const { image_id, annotations, image_base64 } = req.body;

  if (!image_id || !annotations || !image_base64) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  try {
    // 1️⃣ Upload image
    const contentDocId = await uploadImageToLibrary(image_base64, image_id);
    console.log('✅ Image uploaded, ContentDocumentId:', contentDocId);

    // 2️⃣ Create Violation record
    const sfUrl = `${instanceUrl}/services/data/v58.0/sobjects/Violation__c/`;

    const payload = {
      Name: image_id,
      JSON_Data__c: JSON.stringify({ image_id, annotations }),
      Image_Name__c: image_id,
      Uploaded_At__c: new Date().toISOString().split('T')[0],
    };

    const recordRes = await axios.post(sfUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const recordId = recordRes.data.id;
    console.log('✅ Violation record created:', recordId);

    // 3️⃣ Link image to record
    const linkUrl = `${instanceUrl}/services/data/v58.0/sobjects/ContentDocumentLink`;
    await axios.post(linkUrl, {
      ContentDocumentId: contentDocId,
      LinkedEntityId: recordId,
      ShareType: 'V', // View
    }, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    console.log('✅ Image linked to record');

    res.json({ success: true, recordId, contentDocId });
  } catch (err) {
    console.error('❌ Salesforce Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

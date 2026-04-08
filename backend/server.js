require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs'); // for application/x-www-form-urlencoded

const app = express();
app.use(cors());
app.use(express.json());

let accessToken = null;
let instanceUrl = null;

// Function to fetch token from Salesforce
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
    console.log('Salesforce token fetched');
  } catch (err) {
    console.error('Error fetching Salesforce token:', err.message);
  }
}

// Fetch token on server start
fetchSalesforceToken();

// Optional: refresh token every 55 minutes
setInterval(fetchSalesforceToken, 55 * 60 * 1000);

// Endpoint to receive JSON and push to Salesforce
app.post('/save', async (req, res) => {
  const payload = req.body;

  if (!payload || !payload.image_id || !payload.annotations) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  try {
    const sfUrl = `${instanceUrl}/services/data/vXX.X/sobjects/YourObject/${process.env.SF_LIBRARY_ID}`;
    const response = await axios.post(sfUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    res.json({ success: true, sfId: response.data.id });
  } catch (err) {
    console.error("Salesforce Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

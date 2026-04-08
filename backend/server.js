require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors()); // allow requests from frontend
app.use(express.json()); // parse JSON body

// Endpoint to receive JSON from frontend and push to Salesforce
app.post('/save', async (req, res) => {
  const payload = req.body;

  if (!payload || !payload.image_id || !payload.annotations) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  try {
    // Send to Salesforce
    const response = await axios.post(
      process.env.SALESFORCE_URL, // e.g., https://your_instance.salesforce.com/services/data/vXX.X/sobjects/YourObject/
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.SALESFORCE_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ success: true, sfId: response.data.id });
  } catch (err) {
    console.error("Salesforce Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
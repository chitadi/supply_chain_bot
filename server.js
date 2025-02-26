const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS to allow requests from your Next.js app
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Serve PDF files
app.use('/pdfs', express.static(path.join(__dirname, 'public')));

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Get the last user message
    const userMessage = messages.find(m => m.role === 'user');
    if (!userMessage) {
      return res.status(400).json({ error: 'No user message found' });
    }
    
    // System message
    const systemMessage = {
      role: "system",
      content: `You are a knowledgeable supply chain management assistant.
      You can help with various aspects of supply chain management, including:
      - Inventory Management
      - Logistics & Transportation
      - Demand Forecasting
      - Procurement & Supplier Management
      - Warehouse Operations
      - Supply Chain Analytics
      - Risk Management & Resilience
      - Sustainability in Supply Chain
      
      You have also been provided with additional knowledge from two supply chain management textbooks:
      1. "Fundamentals of Supply Chain Management"
      2. "Supply Chain Management: Strategy, Planning, and Operation"
      
      These textbooks cover core principles, strategies, and best practices in supply chain management.
      When answering questions, incorporate relevant concepts from these textbooks when applicable.
      Be concise, practical, and provide actionable insights based on academic knowledge and industry best practices.`
    };
    
    // Call OpenAI directly
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
    });
    
    res.json({ content: response.choices[0].message.content });
  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: error.message || 'An error occurred during the request.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System message template
const systemMessageTemplate = `You are a knowledgeable supply chain management assistant.
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
Be concise, practical, and provide actionable insights based on academic knowledge and industry best practices.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content;
  
  try {
    console.log('Processing request for:', userMessage);
    
    // Load pre-processed PDF chunks
    let pdfChunks;
    try {
      // In production, use the absolute URL
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      console.log('Fetching PDF chunks from:', `${baseUrl}/pdf-chunks.json`);
      const response = await fetch(`${baseUrl}/pdf-chunks.json`);
      
      if (!response.ok) {
        console.error('Failed to load PDF chunks:', response.status, response.statusText);
        throw new Error(`Failed to load PDF chunks: ${response.status} ${response.statusText}`);
      }
      
      pdfChunks = await response.json();
      console.log(`Loaded ${pdfChunks.length} PDF chunks`);
    } catch (error) {
      console.error('Error loading PDF chunks:', error);
      pdfChunks = [];
    }
    
    // Simple search function to find relevant chunks
    function findRelevantChunks(query, chunks, maxResults = 5) {
      // Convert query to lowercase for case-insensitive matching
      const lowerQuery = query.toLowerCase();
      
      // Score each chunk based on how many query terms it contains
      const scoredChunks = chunks.map(chunk => {
        const lowerText = chunk.text.toLowerCase();
        // Simple scoring: count occurrences of query terms
        const score = lowerQuery.split(' ')
          .filter(term => term.length > 3) // Only consider meaningful terms
          .reduce((score, term) => {
            const regex = new RegExp(term, 'gi');
            const matches = (lowerText.match(regex) || []).length;
            return score + matches;
          }, 0);
          
        return { ...chunk, score };
      });
      
      // Sort by score and take top results
      return scoredChunks
        .filter(chunk => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
    }
    
    // Find relevant chunks based on user query
    const relevantChunks = findRelevantChunks(userMessage, pdfChunks);
    console.log(`Found ${relevantChunks.length} relevant chunks`);
    
    // Create context from relevant chunks
    let context = '';
    if (relevantChunks.length > 0) {
      context = 'Here is some relevant information from the textbooks:\n\n';
      relevantChunks.forEach(chunk => {
        context += `From "${chunk.source}":\n${chunk.text}\n\n`;
      });
    }
    
    // Prepare messages for OpenAI
    const promptMessages = [
      { role: "system", content: systemMessageTemplate },
      ...messages.slice(0, -1),
      { role: "user", content: context ? `${context}\n\nUser question: ${userMessage}` : userMessage }
    ];
    
    console.log('Calling OpenAI API...');
    
    // Call OpenAI API directly
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-turbo',
      messages: promptMessages,
      temperature: 0.7,
    });
    
    console.log('OpenAI API call successful');
    
    return NextResponse.json({
      content: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

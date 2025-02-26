import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from '@langchain/openai';

// System message template
const systemMessageTemplate = {
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

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content;
  
  try {
    // Load pre-processed PDF chunks from JSON file
    const response = await fetch('/pdf-chunks.json');
    const pdfChunks = await response.json();
    
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
      systemMessageTemplate,
      ...messages.slice(0, -1),
      { role: "user", content: context + "\n\nUser question: " + userMessage }
    ];
    
    // Call OpenAI
    const llm = new OpenAI({
      temperature: 0.7,
      modelName: 'gpt-3.5-turbo',
    });
    
    const result = await llm.invoke(promptMessages);
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'An error occurred during the request.' },
      { status: 500 }
    );
  }
}

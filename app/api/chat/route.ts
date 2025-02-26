import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from '@langchain/openai';
import { PDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/core/document_transformers/text_splitter';
import { MemoryVectorStore } from '@langchain/community/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai/embeddings';
import path from 'path';

// Initialize vector store
let vectorStore: MemoryVectorStore | null = null;

// Function to load and process PDFs
async function loadPDFs() {
  try {
    // Define PDF paths
    const pdfPaths = [
      '/fundamentals-of-supply-chain-management.pdf',
      '/SupplyChainManagementStrategyPlanningandOperation.pdf'
    ];
    
    // Load and process each PDF
    let allDocs = [];
    
    for (const pdfPath of pdfPaths) {
      // Create a blob URL for the PDF
      const loader = new PDFLoader(`${process.env.VERCEL_URL || 'http://localhost:3000'}${pdfPath}`);
      const docs = await loader.load();
      allDocs = [...allDocs, ...docs];
    }
    
    console.log(`Loaded ${allDocs.length} pages from PDFs`);
    
    // Split documents into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    const splitDocs = await textSplitter.splitDocuments(allDocs);
    
    console.log(`Split into ${splitDocs.length} chunks`);
    
    // Create vector store
    vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      new OpenAIEmbeddings()
    );
    
    return true;
  } catch (error) {
    console.error("Error loading PDFs:", error);
    return false;
  }
}

// System message with supply chain expertise
const systemMessage = {
  role: "system",
  content: `You are an expert Supply Chain Management AI Assistant with deep knowledge across:
  - Inventory Management & Optimization
  - Demand Forecasting & Planning
  - Logistics & Transportation
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
    // Load PDFs if not already loaded
    if (!vectorStore) {
      console.log("Loading PDFs...");
      await loadPDFs();
    }
    
    // Search for relevant context from the PDFs
    let relevantContext = '';
    if (vectorStore) {
      console.log("Searching for relevant context...");
      const results = await vectorStore.similaritySearch(userMessage, 5);
      if (results.length > 0) {
        relevantContext = `Here's some relevant information from the supply chain management textbooks:\n\n`;
        results.forEach((doc, i) => {
          relevantContext += `[Source: ${doc.metadata.source || 'textbook'}, Page: ${doc.metadata.loc?.pageNumber || 'unknown'}]\n${doc.pageContent}\n\n`;
        });
      }
    }
    
    // Create enhanced system message with relevant context
    const enhancedSystemMessage = {
      role: "system",
      content: systemMessage.content + (relevantContext ? `\n\nAdditional context for this query:\n${relevantContext}` : '')
    };
    
    // Create message array with enhanced system message
    const enhancedMessages = [
      enhancedSystemMessage,
      ...messages
    ];
    
    // Call OpenAI API
    const response = await OpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: enhancedMessages,
    });
    
    // Return the response
    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: "An error occurred during the request." }, { status: 500 });
  }
}

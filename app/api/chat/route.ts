import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "@langchain/core/text_splitter"
import { MemoryVectorStore } from "@langchain/community/vectorstores/memory"
import { OpenAIEmbeddings } from "@langchain/openai"
import path from "path"

export const runtime = 'edge'

// Initialize vector store with PDF content
let vectorStore: MemoryVectorStore | null = null

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
  
  Format your responses for readability:
  - Use **bold** for important terms and concepts
  - Use proper paragraph breaks for different topics
  - Use bullet points for lists
  - Include line breaks between sections
  - Structure complex information in a hierarchical manner
  
  You have been trained on extensive academic materials, industry best practices, and real-world case studies.
  Provide practical, actionable advice and always maintain context of the ongoing conversation.
  When appropriate, cite specific methodologies, frameworks, or industry standards.
  If you need clarification, ask follow-up questions to provide more accurate assistance.`
}

// Function to load and process PDFs
async function loadPDFs() {
  try {
    // Define PDF paths
    const pdfPaths = [
      path.join(process.cwd(), 'fundamentals-of-supply-chain-management.pdf'),
      path.join(process.cwd(), 'SupplyChainManagementStrategyPlanningandOperation.pdf')
    ]
    
    // Load and process each PDF
    const docs = []
    for (const pdfPath of pdfPaths) {
      const loader = new PDFLoader(pdfPath)
      const pdfDocs = await loader.load()
      docs.push(...pdfDocs)
    }
    
    // Split documents into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    })
    const splitDocs = await textSplitter.splitDocuments(docs)
    
    // Create vector store
    vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      new OpenAIEmbeddings()
    )
    
    return true
  } catch (error) {
    console.error("Error loading PDFs:", error)
    return false
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  // Add system message if it's not already present
  const conversationHistory = messages[0]?.role === "system" 
    ? messages 
    : [systemMessage, ...messages]
  
  // Get the user's latest message
  const userMessage = messages[messages.length - 1].content
  
  // Initialize vector store if not already done
  if (!vectorStore) {
    await loadPDFs()
  }
  
  // Retrieve relevant context from PDFs if vector store is available
  let contextText = ""
  if (vectorStore) {
    try {
      const relevantDocs = await vectorStore.similaritySearch(userMessage, 3)
      contextText = relevantDocs.map(doc => doc.pageContent).join("\n\n")
    } catch (error) {
      console.error("Error retrieving context:", error)
    }
  }
  
  // Add context to system message if available
  let enhancedSystemMessage = systemMessage
  if (contextText) {
    enhancedSystemMessage = {
      role: "system",
      content: `${systemMessage.content}\n\nHere is additional context from supply chain management textbooks that may be relevant to the user's query:\n\n${contextText}`
    }
    
    // Replace the system message in the conversation history
    if (conversationHistory[0].role === "system") {
      conversationHistory[0] = enhancedSystemMessage
    } else {
      conversationHistory.unshift(enhancedSystemMessage)
    }
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: conversationHistory,
    temperature: 0.7,
  })

  return result.toDataStreamResponse()
}

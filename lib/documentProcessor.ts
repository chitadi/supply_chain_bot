import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PineconeStore } from "langchain/vectorstores/pinecone"
import { PineconeClient } from "@pinecone-database/pinecone"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

const systemMessage = {
  role: "system",
  content: `You are an expert Supply Chain Management AI Assistant with deep knowledge across:
  - Inventory Management & Optimization
  - Demand Forecasting & Planning
  - Logistics & Transportation
  - Procurement & Supplier Management
 

export async function processDocument(filePath: string) {
  // Load PDF
  const loader = new PDFLoader(filePath)
  const rawDocs = await loader.load()

  // Split text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })
  const docs = await textSplitter.splitDocuments(rawDocs)

  // Initialize Pinecone
  const pinecone = new PineconeClient()
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  })

  // Store embeddings
  const embeddings = new OpenAIEmbeddings()
  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex: pinecone.Index(process.env.PINECONE_INDEX_NAME!),
  })
} 
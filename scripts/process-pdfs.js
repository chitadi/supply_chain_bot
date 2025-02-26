const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Define PDF paths
const pdfPaths = [
  path.join(process.cwd(), 'public', 'fundamentals-of-supply-chain-management.pdf'),
  path.join(process.cwd(), 'public', 'SupplyChainManagementStrategyPlanningandOperation.pdf')
];

// Function to extract text from a PDF
async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error extracting text from ${pdfPath}:`, error);
    return '';
  }
}

// Function to split text into chunks
function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  
  return chunks;
}

// Main function to process PDFs
async function processPDFs() {
  const allChunks = [];
  
  for (const pdfPath of pdfPaths) {
    console.log(`Processing ${pdfPath}...`);
    const text = await extractTextFromPDF(pdfPath);
    const chunks = splitTextIntoChunks(text);
    
    chunks.forEach(chunk => {
      allChunks.push({
        text: chunk,
        source: path.basename(pdfPath)
      });
    });
    
    console.log(`Extracted ${chunks.length} chunks from ${path.basename(pdfPath)}`);
  }
  
  // Save chunks to JSON file
  const outputPath = path.join(process.cwd(), 'public', 'pdf-chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
  console.log(`Saved ${allChunks.length} chunks to ${outputPath}`);
}

// Run the script
processPDFs().catch(error => {
  console.error('Error processing PDFs:', error);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function processPDFs() {
  try {
    // Define PDF paths
    const pdfPaths = [
      path.join(__dirname, '..', 'fundamentals-of-supply-chain-management.pdf'),
      path.join(__dirname, '..', 'SupplyChainManagementStrategyPlanningandOperation.pdf')
    ];
    
    // Load and process each PDF
    const allChunks = [];
    let chunkId = 0;
    
    for (const pdfPath of pdfPaths) {
      console.log(`Processing ${pdfPath}...`);
      const filename = path.basename(pdfPath);
      const dataBuffer = fs.readFileSync(pdfPath);
      
      const data = await pdf(dataBuffer);
      console.log(`PDF ${filename} has ${data.numpages} pages`);
      
      // Split text into chunks (simple approach - split by paragraphs)
      const text = data.text;
      const paragraphs = text.split(/\n\s*\n/);
      
      // Create chunks with some overlap
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        if (paragraph.length > 20) { // Ignore very short paragraphs
          allChunks.push({
            id: chunkId++,
            content: paragraph,
            metadata: {
              source: filename
            }
          });
        }
      }
    }
    
    console.log(`Created ${allChunks.length} chunks from PDFs`);
    
    // Save to JSON file
    const outputPath = path.join(__dirname, '..', 'public', 'pdf-chunks.json');
    fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2));
    
    console.log(`Saved ${allChunks.length} chunks to ${outputPath}`);
  } catch (error) {
    console.error("Error processing PDFs:", error);
  }
}

processPDFs();

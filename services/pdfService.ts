

// This service relies on global scripts loaded in index.html for pdfjsLib, html2canvas, and jspdf.
// In a typical bundled application, these would be imported from npm packages.

declare const pdfjsLib: any;
declare const html2canvas: any;
declare const jspdf: any;

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return fullText;
}

export async function exportToPdf(elementId: string) {
  const { jsPDF } = jspdf;
  const infographicContainer = document.getElementById(elementId);
  if (!infographicContainer) {
      console.error('Element not found for PDF export');
      return;
  }
  
  const pages = infographicContainer.children;
  if (pages.length === 0) {
      console.error('No pages found to export');
      return;
  }
  
  document.body.classList.add('exporting-pdf');

  try {
      // Legal paper size in points: 8.5 x 14 inches -> 612 x 1008 points
      const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'legal'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('infographic-report.pdf');
  } finally {
      document.body.classList.remove('exporting-pdf');
  }
}
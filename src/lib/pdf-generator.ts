/**
 * PDF generation utilities
 */

export interface PdfOptions {
  margin: number;
  filename: string;
  image: { type: string; quality: number };
  html2canvas: { scale: number };
  jsPDF: { unit: string; format: string; orientation: string };
}

export class PdfGenerator {
  private static defaultOptions: PdfOptions = {
    margin: 1,
    filename: 'document.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  static async generateFromElement(element: HTMLElement, options: Partial<PdfOptions> = {}): Promise<Blob> {
    if (typeof window === 'undefined' || typeof html2pdf === 'undefined') {
      throw new Error('PDF generation library not available');
    }

    const finalOptions = { ...this.defaultOptions, ...options };

    try {
      // Temporarily show the element for PDF generation
      const originalStyle = {
        position: element.style.position,
        left: element.style.left,
        visibility: element.style.visibility
      };

      element.style.position = 'absolute';
      element.style.left = '0';
      element.style.visibility = 'visible';

      const pdfBlob = await html2pdf()
        .from(element)
        .set(finalOptions)
        .output('blob');

      // Restore original styles
      element.style.position = originalStyle.position;
      element.style.left = originalStyle.left;
      element.style.visibility = originalStyle.visibility;

      return pdfBlob;
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  static createFilename(title: string): string {
    const sanitized = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const timestamp = Date.now();
    return `${sanitized}_${timestamp}.pdf`;
  }
}
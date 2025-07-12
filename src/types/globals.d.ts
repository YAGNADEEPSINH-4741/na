declare global {
  const gapi: any;
  const html2pdf: any;
  interface Window {
    gapiOnLoad?: () => void;
    gsiOnLoad?: () => void;
  }
  namespace google {
    namespace accounts {
      namespace oauth2 {
        function initTokenClient(config: any): any;
      }
    }
  }
}

export {};

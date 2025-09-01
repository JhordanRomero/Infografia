import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import InfographicDisplay from './components/InfographicDisplay';
import Loader from './components/Loader';
import { extractTextFromPdf } from './services/pdfService';
import { generateInfographicData } from './services/geminiService';
import type { InfographicData } from './types';
import Icon from './components/Icon';

const WALMART_CHILE_WHITE_LOGO_URL = 'https://www.walmartchile.cl/wp-content/uploads/2025/07/logowm_white.png';
const WALMART_CHILE_BLUE_LOGO_URL = 'https://static.wikia.nocookie.net/logopedia/images/b/b4/Walmart_Chile_alternate_2025.svg/revision/latest/scale-to-width-down/300?cb=20250718182747';


export default function App() {
  const [infographicData, setInfographicData] = useState<InfographicData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileProcess = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setInfographicData(null);
    setFileName(file.name);

    try {
      const text = await extractTextFromPdf(file);
      if (!text) {
        throw new Error("No se pudo extraer texto del PDF. El archivo puede estar vacío o dañado.");
      }
      const data = await generateInfographicData(text);
      setInfographicData(data);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setError(`No se pudo generar la infografía. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetState = () => {
    setInfographicData(null);
    setError(null);
    setIsLoading(false);
    setFileName('');
  };

  return (
    <div className="min-h-screen bg-gray-100 text-bentonville-blue font-sans flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-7xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <img src={WALMART_CHILE_BLUE_LOGO_URL} alt="Walmart Chile Logo" className="h-8 object-contain" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-bentonville-blue">Generador de Infografías AI</h1>
        </div>
        {infographicData && (
          <button
            onClick={resetState}
            className="flex items-center gap-2 bg-true-blue text-white font-bold py-2 px-4 rounded-lg"
          >
            <Icon name="refresh" />
            <span>Nuevo Reporte</span>
          </button>
        )}
      </header>
      
      <main className="w-full flex-grow flex flex-col items-center justify-center">
        {!infographicData && !isLoading && !error && (
          <div className="text-center max-w-2xl">
              <h2 className="text-4xl font-extrabold text-bentonville-blue mb-4">Transforma Reportes PDF en Infografías Impresionantes</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Sube un PDF de rendimiento del programa y nuestra IA analizará el contenido para generar un hermoso reporte de varias páginas, siguiendo los lineamientos de marca de Walmart 2025.
              </p>
              <FileUpload onFileSelect={handleFileProcess} />
          </div>
        )}

        {isLoading && (
          <Loader fileName={fileName} />
        )}

        {error && (
          <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-2xl">
            <div className="flex justify-center items-center mb-4">
                <Icon name="error" className="text-red-500 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold text-red-800 mb-2">Falló la Generación</h3>
            <p className="text-red-600">{error}</p>
            <button
                onClick={resetState}
                className="mt-6 bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
            >
                Intentar de Nuevo
            </button>
          </div>
        )}

        {infographicData && !isLoading && (
          <InfographicDisplay data={infographicData} />
        )}
      </main>
      <footer className="w-full max-w-7xl text-center mt-8 text-gray-500 text-sm">
        <p>Generado siguiendo los lineamientos de marca de Walmart 2025.</p>
        <p>&copy; {new Date().getFullYear()} Generador de Infografías AI. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
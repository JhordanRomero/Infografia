import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="w-16 h-16 border-8 border-dashed rounded-full animate-spin border-true-blue"></div>
);

const Loader: React.FC<{ fileName: string }> = ({ fileName }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-xl">
      <LoadingSpinner />
      <h2 className="text-3xl font-bold text-bentonville-blue mt-8">Generando tu Infografía...</h2>
      <p className="text-gray-600 mt-2 max-w-lg">
        Nuestra IA está analizando <span className="font-semibold text-true-blue">{fileName}</span>, extrayendo datos clave y diseñando tu reporte. Esto puede tardar un momento.
      </p>
      <div className="mt-4 text-sm text-gray-500">
          <p>Analizando estructura del contenido...</p>
          <p>Extrayendo indicadores clave de rendimiento...</p>
          <p>Construyendo visualizaciones de datos...</p>
      </div>
    </div>
  );
};

export default Loader;
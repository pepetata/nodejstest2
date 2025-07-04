import React from 'react';
import ReactMarkdown from 'react-markdown';
import { termosDeServico } from '../../documents/termos-de-servico';

const TermsTest = () => {
  console.log('termosDeServico:', typeof termosDeServico, termosDeServico?.slice(0, 100));

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Terms Test</h2>
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h3>Raw content (first 200 chars):</h3>
        <pre>{termosDeServico?.slice(0, 200)}...</pre>
      </div>
      <div style={{ border: '1px solid #ccc', padding: '10px' }}>
        <h3>Rendered markdown:</h3>
        <ReactMarkdown>{termosDeServico}</ReactMarkdown>
      </div>
    </div>
  );
};

export default TermsTest;

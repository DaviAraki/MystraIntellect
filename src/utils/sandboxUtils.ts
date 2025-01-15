export const prepareSandboxFiles = async (files: Record<string, { content: string }>) => {
  const sandboxFiles: Record<string, { content: string }> = {
    'package.json': {
      content: JSON.stringify({
        name: "react-sandbox",
        version: "1.0.0",
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "react-scripts": "5.0.1"
        },
        scripts: {
          start: "react-scripts start"
        }
      })
    },
    'public/index.html': {
      content: `<!DOCTYPE html><html><body><div id="root"></div></body></html>`
    },
    'src/index.js': {
      content: `import React from 'react';import ReactDOM from 'react-dom';import App from './App';ReactDOM.render(<App />, document.getElementById('root'));`
    }
  };

  // Add user files
  Object.entries(files).forEach(([filename, { content }]) => {
    const adjustedFilename = filename.startsWith('src/') ? filename : `src/${filename}`;
    sandboxFiles[adjustedFilename.replace(/\.javascript$/, '.js')] = { content };
  });

  return sandboxFiles;
};

export const createCodeSandbox = async (files: Record<string, { content: string }>) => {
  const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  });

  if (!response.ok) throw new Error('Failed to create sandbox');
  return response.json();
}; 
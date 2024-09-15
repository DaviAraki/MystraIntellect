import React, { useEffect, useState } from 'react';

interface CodePreviewProps {
  code: string;
  language: string;
}

export function CodePreview({ code, language }: CodePreviewProps) {
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSandbox = async () => {
      if (!code) {
        setSandboxId(null);
        return;
      }

      try {
        let files: Record<string, { content: string }> = {};
        
        switch (language) {
          case 'react':
            files = {
              'package.json': {
                content: JSON.stringify({
                  dependencies: {
                    react: "^17.0.2",
                    "react-dom": "^17.0.2"
                  }
                })
              },
              'index.js': {
                content: `
                  import React from 'react';
                  import ReactDOM from 'react-dom';
                  import App from './App';
                  ReactDOM.render(<App />, document.getElementById('root'));
                `
              },
              'App.js': {
                content: code
              }
            };
            break;
          case 'vue':
            files = {
              'package.json': {
                content: JSON.stringify({
                  dependencies: {
                    vue: "^2.6.14"
                  }
                })
              },
              'index.js': {
                content: `
                  import Vue from 'vue';
                  import App from './App.vue';
                  new Vue({
                    render: h => h(App)
                  }).$mount('#app');
                `
              },
              'App.vue': {
                content: code
              }
            };
            break;
          default:
            files = {
              'index.html': {
                content: code
              }
            };
        }

        const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files })
        });

        if (!response.ok) {
          throw new Error('Failed to create sandbox');
        }

        const data = await response.json();
        setSandboxId(data.sandbox_id);
        setError(null);
      } catch (e) {
        console.error('Error creating sandbox:', e);
        setError('Failed to create preview');
      }
    };

    createSandbox();
  }, [code, language]);

  if (error) {
    return <div className="p-2 text-red-500">{error}</div>;
  }

  if (!sandboxId) {
    return <div className="p-4 text-gray-500">Loading preview...</div>;
  }

  return (
    <div className="sticky top-0 right-0 w-1/2 h-screen border-l border-gray-800 flex flex-col">
      <div className="p-2 bg-gray-900 text-green-400">Code Preview ({language})</div>
      <iframe
        src={`https://codesandbox.io/embed/${sandboxId}?fontsize=14&hidenavigation=1&theme=dark`}
        className="w-full flex-grow"
        title="Code Preview"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    </div>
  );
}

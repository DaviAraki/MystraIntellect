import React, { useEffect, useState } from 'react';

interface CodePreviewProps {
  code: string;
  language: string;
  onClose: () => void; 
}

export function CodePreview({ code, language, onClose }: CodePreviewProps) {
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
        
        const isReactCode = code.includes('React.') || code.includes('import React') || code.includes('extends React.Component');
        
        if (isReactCode || language === 'react') {
          files = {
            'package.json': {
              content: JSON.stringify({
                dependencies: {
                  react: "^18.3.1",
                  "react-dom": "^18.3.1"
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
            },
            'App.css': {
              content: ''
            }
          };
        } else if (language === 'vue') {
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
        } else {
          files = {
            'index.html': {
              content: `
                <!DOCTYPE html>
                <html>
                  <body>
                    <div id="app"></div>
                    <script>${code}</script>
                  </body>
                </html>
              `
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
    return (
      <div className="sticky top-0 right-0 w-1/2 h-screen border-l border-gray-800 flex flex-col">
        <div className="p-2 bg-gray-900 text-green-400 flex justify-between items-center">
          <span>Code Preview ({language})</span>
          <button onClick={onClose} className="text-white hover:text-red-500">
            ✕
          </button>
        </div>
        <div className="p-2 text-red-500">{error}</div>
      </div>
    );
  }

  if (!sandboxId) {
    return (
      <div className="sticky top-0 right-0 w-1/2 h-screen border-l border-gray-800 flex flex-col">
        <div className="p-2 bg-gray-900 text-green-400 flex justify-between items-center">
          <span>Code Preview ({language})</span>
          <button onClick={onClose} className="text-white hover:text-red-500">
            ✕
          </button>
        </div>
        <div className="p-4 text-gray-500">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 right-0 w-1/2 h-screen border-l border-gray-800 flex flex-col">
      <div className="p-2 bg-gray-900 text-green-400 flex justify-between items-center">
        <span>Code Preview ({language})</span>
        <button onClick={onClose} className="text-white hover:text-red-500">
          ✕
        </button>
      </div>
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

import React, { useEffect, useState } from 'react';

interface LivePreviewProps {
  files: Record<string, { content: string }>;
  onClose: () => void;
}

export function LivePreview({ files, onClose }: LivePreviewProps) {
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  console.log('files', files);

  useEffect(() => {
    const createSandbox = async () => {
      console.log('Creating sandbox with files:', files);
      if (Object.keys(files).length === 0) {
        setSandboxId(null);
        return;
      }

      // Prepare files for CodeSandbox
      const sandboxFiles: Record<string, { content: string }> = {
        'package.json': {
          content: JSON.stringify({
            name: "react-sandbox",
            version: "1.0.0",
            description: "React sandbox",
            main: "src/index.js",
            dependencies: {
              react: "^18.3.1",
              "react-dom": "^18.3.1",
              "react-scripts": "5.0.1"
            },
            scripts: {
              start: "react-scripts start",
              build: "react-scripts build",
              test: "react-scripts test --env=jsdom",
              eject: "react-scripts eject"
            }
          })
        },
        'public/index.html': {
          content: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>React App</title>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>
          `.trim()
        },
        'src/index.js': {
          content: `
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
          `.trim()
        }
      };

      // Add user files to sandboxFiles, adjusting paths if necessary
      Object.entries(files).forEach(([filename, { content }]) => {
        let adjustedFilename = filename;
        if (!filename.startsWith('src/')) {
          adjustedFilename = `src/${adjustedFilename}`;
        }
        // Convert .javascript extension to .js
        adjustedFilename = adjustedFilename.replace(/\.javascript$/, '.js');
        sandboxFiles[adjustedFilename] = { content };
      });

      try {
        const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: sandboxFiles })
        });

        if (!response.ok) {
          throw new Error('Failed to create sandbox');
        }

        const data = await response.json();
        console.log('Sandbox created:', data);
        setSandboxId(data.sandbox_id);
        setError(null);
      } catch (e) {
        console.error('Error creating sandbox:', e);
        setError('Failed to create preview');
      }
    };

    createSandbox();
  }, [files]);

  if (error) {
    return (
      <div className="sticky top-0 right-0 w-1/2 h-screen border-l border-gray-800 flex flex-col">
        <div className="p-2 bg-gray-900 text-green-400 flex justify-between items-center">
          <span>Code Preview</span>
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
          <span>Code Preview</span>
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
        <span>Code Preview</span>
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

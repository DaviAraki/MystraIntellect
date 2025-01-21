import React, { useEffect } from 'react'
import { PreviewContainer } from './PreviewContainer'
import { useWebContainer } from '@/hooks/useWebContainer'

interface LivePreviewProps {
  files: Record<string, { content: string }>
  onClose: () => void
}

export function LivePreview({ files, onClose }: LivePreviewProps) {
  const { runCode, iframeUrl, isLoading } = useWebContainer()

  useEffect(() => {
    if (Object.keys(files).length === 0) return

    const webContainerFiles = {
      'package.json': JSON.stringify({
        name: 'preview-app',
        type: 'module',
        scripts: {
          dev: 'vite',
        },
        dependencies: {
          react: 'latest',
          'react-dom': 'latest',
        },
        devDependencies: {
          '@vitejs/plugin-react': 'latest',
          vite: 'latest',
        },
      }),
      'vite.config.js': `
        import { defineConfig } from 'vite'
        import react from '@vitejs/plugin-react'
        
        export default defineConfig({
          plugins: [react()]
        })
      `,
      'main.jsx': files['App.js']?.content || '',
      'Calculator.jsx': files['Calculator.js']?.content || '',
      'style.css': files['App.css']?.content || '',
      'index.html': `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preview</title>
            <link rel="stylesheet" href="style.css" />
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/main.jsx"></script>
          </body>
        </html>
      `,
    }

    console.log('Running with files:', webContainerFiles)
    runCode(webContainerFiles)
  }, [files, runCode])

  return (
    <PreviewContainer title='Code Preview' onClose={onClose}>
      {isLoading ? (
        <div className='p-4 text-gray-500'>Loading WebContainer...</div>
      ) : !iframeUrl ? (
        <div className='p-4 text-gray-500'>Starting preview server...</div>
      ) : (
        <iframe
          src={iframeUrl}
          className='w-full flex-grow border-0'
          title='Code Preview'
          allow='accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking'
          sandbox='allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts'
        />
      )}
    </PreviewContainer>
  )
}

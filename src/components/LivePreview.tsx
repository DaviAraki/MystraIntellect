import React, { useEffect, useState } from 'react';
import { PreviewContainer } from './PreviewContainer';
import { createCodeSandbox, prepareSandboxFiles } from '@/utils/sandboxUtils';

interface LivePreviewProps {
  files: Record<string, { content: string }>;
  onClose: () => void;
}

export function LivePreview({ files, onClose }: LivePreviewProps) {
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSandbox = async () => {
      if (Object.keys(files).length === 0) {
        setSandboxId(null);
        return;
      }

      try {
        const sandboxFiles = await prepareSandboxFiles(files);
        const response = await createCodeSandbox(sandboxFiles);
        setSandboxId(response.sandbox_id);
        setError(null);
      } catch (e) {
        console.error('Error creating sandbox:', e);
        setError('Failed to create preview');
      }
    };

    createSandbox();
  }, [files]);

  return (
    <PreviewContainer title="Code Preview" onClose={onClose}>
      {error ? (
        <div className="p-2 text-red-500">{error}</div>
      ) : !sandboxId ? (
        <div className="p-4 text-gray-500">Loading preview...</div>
      ) : (
        <iframe
          src={`https://codesandbox.io/embed/${sandboxId}?fontsize=14&hidenavigation=1&theme=dark`}
          className="w-full flex-grow"
          title="Code Preview"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      )}
    </PreviewContainer>
  );
}
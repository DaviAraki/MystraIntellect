import { useCallback } from 'react';
import { Message } from '@/types/message';

export function useCodePreview(message: Message) {
  const handlePreviewCode = useCallback(() => {
    const files: Record<string, { content: string }> = {};
    
    const codeBlockRegex = /```(\w+)\n([\s\S]+?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(message.text)) !== null) {
      const [, language, content] = match;
      
      if (language.toLowerCase() === 'bash' || language.toLowerCase() === 'shell') {
        continue;
      }

      // Updated regex to match more filename patterns
      const fileNameMatch = content.match(/\/\/\s*\[(.+?)\]|\*\s*\[(.+?)\]|\/\*\s*\[(.+?)\]|\[filename:\s*(.+?)\]/);
      let fileName = fileNameMatch 
        ? (fileNameMatch[1] || fileNameMatch[2] || fileNameMatch[3] || fileNameMatch[4]).trim() 
        : `file.${language}`;

      // Extract only the filename, removing any brackets, prefixes, and "filename:" prefix
      fileName = fileName.replace(/^\[(?:filename:\s*)?|\]$|^filename:\s*/g, '').trim();

      // Remove the filename pattern from the content
      const contentWithoutFilename = content.replace(/\/\/\s*\[.+?\]|\*\s*\[.+?\]|\/\*\s*\[.+?\]|\[filename:\s*.+?\]/, '').trim();

      files[fileName] = { content: contentWithoutFilename };
    }

    return files;
  }, [message.text]);

  const hasCode = /```(\w+)\n([\s\S]+?)```/g.test(message.text);

  return { handlePreviewCode, hasCode };
}

import { useState, useCallback, useEffect } from 'react';
import { Message } from '@/types/message';

interface FileData {
  content: string;
  language: string;
}

export function useLivePreview(message: Message) {
  const [files, setFiles] = useState<Record<string, FileData>>({});

  const parseFiles = useCallback(() => {
    const newFiles: Record<string, FileData> = {};
    const codeBlockRegex = /```(\w+)\n([\s\S]+?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(message.text)) !== null) {
      const [, language, content] = match;
      
      if (language.toLowerCase() === 'bash' || language.toLowerCase() === 'shell') {
        continue;
      }

      const fileNameMatch = content.match(/\/\/\s*\[(.+?)\]|\*\s*\[(.+?)\]|\/\*\s*\[(.+?)\]|\[filename:\s*(.+?)\]/);
      let fileName = fileNameMatch 
        ? (fileNameMatch[1] || fileNameMatch[2] || fileNameMatch[3] || fileNameMatch[4]).trim() 
        : `file.${language}`;

      fileName = fileName.replace(/^\[(?:filename:\s*)?|\]$|^filename:\s*/g, '').trim();

      const contentWithoutFilename = content.replace(/\/\/\s*\[.+?\]|\*\s*\[.+?\]|\/\*\s*\[.+?\]|\[filename:\s*.+?\]/, '').trim();

      newFiles[fileName] = { content: contentWithoutFilename, language };
    }

    setFiles(newFiles);
  }, [message.text]);

  useEffect(() => {
    parseFiles();
  }, [parseFiles]);

  const updateFileName = useCallback((oldFileName: string, newFileName: string) => {
    setFiles(prevFiles => {
      const updatedFiles = { ...prevFiles };
      if (oldFileName in updatedFiles) {
        updatedFiles[newFileName] = updatedFiles[oldFileName];
        delete updatedFiles[oldFileName];
      }
      return updatedFiles;
    });
  }, []);

  const updateFileContent = useCallback((fileName: string, newContent: string) => {
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileName]: { ...prevFiles[fileName], content: newContent },
    }));
  }, []);

  const addNewFile = useCallback((fileName: string, content: string, language: string) => {
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileName]: { content, language },
    }));
  }, []);

  const deleteFile = useCallback((fileName: string) => {
    setFiles(prevFiles => {
      const updatedFiles = { ...prevFiles };
      delete updatedFiles[fileName];
      return updatedFiles;
    });
  }, []);

  const getPreviewFiles = useCallback(() => {
    return Object.entries(files).reduce((acc, [fileName, { content }]) => {
      acc[fileName] = { content };
      return acc;
    }, {} as Record<string, { content: string }>);
  }, [files]);

  const hasCode = Object.keys(files).length > 0;

  return { 
    files,
    updateFileName,
    updateFileContent,
    addNewFile,
    deleteFile,
    getPreviewFiles,
    hasCode
  };
}

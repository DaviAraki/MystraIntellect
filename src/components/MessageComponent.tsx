import React, { useState } from 'react';
import { User, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';

import { Message } from '@/types/message';
import { CodeBlock } from './CodeBlock';
import { Button } from './ui/button';
import { useLivePreview } from '@/hooks/useLivePreview';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface MessageComponentProps {
  message: Message;
  onPreviewCode: (files: Record<string, { content: string }>) => void;
}

export function MessageComponent({ message, onPreviewCode }: MessageComponentProps) {
  const { 
    files, 
    updateFileName, 
    updateFileContent, 
    addNewFile, 
    deleteFile, 
    getPreviewFiles, 
    hasCode 
  } = useLivePreview(message);

  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [editingFileNameValue, setEditingFileNameValue] = useState('');

  const handleFileNameEdit = (fileName: string) => {
    setEditingFileName(fileName);
    setEditingFileNameValue(fileName);
  };

  const handleFileNameChange = (oldFileName: string) => {
    if (editingFileNameValue && editingFileNameValue !== oldFileName) {
      updateFileName(oldFileName, editingFileNameValue);
      setActiveTab(editingFileNameValue);
    }
    setEditingFileName(null);
  };

  const onPreviewClick = () => {
    const previewFiles = getPreviewFiles();
    if (Object.keys(previewFiles).length > 0) {
      onPreviewCode(previewFiles);
      setIsModalOpen(false); // Close the modal
    } else {
      console.log('No files extracted');
    }
  };

  const handleFileContentChange = (fileName: string, newContent: string) => {
    updateFileContent(fileName, newContent);
  };

  const handleAddNewFile = () => {
    if (newFileName && newFileContent) {
      addNewFile(newFileName, newFileContent, 'javascript'); // Assuming JavaScript as default language
      setNewFileName('');
      setNewFileContent('');
    }
  };

  const handleDeleteFile = (fileName: string) => {
    deleteFile(fileName);
  };

  return (
    <div className="mb-4 flex items-start">
      {message.sender === 'user' ? (
        <User className="mr-2 h-6 w-6 text-green-400" />
      ) : (
        <Bot className="mr-2 h-6 w-6 text-green-400" />
      )}
      <div className="bg-gray-900 rounded p-2 max-w-[80%]">
        {message.sender === 'user' ? (
          <p>{message.text}</p>
        ) : (
          <>
            <ReactMarkdown 
              className="prose prose-invert max-w-none"
              components={{
                code: ({  className, children, ...props }) => 
                  CodeBlock({  className, children, ...props })
              }}
            >
              {message.text}
            </ReactMarkdown>
            {hasCode && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-2">View Extracted Files</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] overflow-y-auto crisp-rendering bg-gray-900 text-gray-100">
                  <DialogHeader>
                    <DialogTitle className="text-gray-100">Extracted Files</DialogTitle>
                  </DialogHeader>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-gray-800">
                      {Object.keys(files).map((fileName) => (
                        <TabsTrigger 
                          key={fileName} 
                          value={fileName}
                          className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                        >
                          {editingFileName === fileName ? (
                            <Input
                              value={editingFileNameValue}
                              onChange={(e) => setEditingFileNameValue(e.target.value)}
                              onBlur={() => handleFileNameChange(fileName)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleFileNameChange(fileName);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <span onDoubleClick={() => handleFileNameEdit(fileName)}>{fileName}</span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {Object.entries(files).map(([fileName, fileData]) => (
                      <TabsContent key={fileName} value={fileName}>
                        <div className="mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-100">{fileName}</span>
                            <Button onClick={() => handleDeleteFile(fileName)} className="ml-2 text-xs bg-red-600 hover:bg-red-700 text-white">Delete</Button>
                          </div>
                          <textarea
                            value={fileData.content}
                            onChange={(e) => handleFileContentChange(fileName, e.target.value)}
                            className="w-full mt-1 bg-gray-800 text-gray-100 p-2 rounded border border-gray-700"
                            rows={20}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                  <div className="mt-4">
                    <Input
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="New file name"
                      className="mb-2 bg-gray-800 text-gray-100 border-gray-700"
                    />
                    <textarea
                      value={newFileContent}
                      onChange={(e) => setNewFileContent(e.target.value)}
                      placeholder="New file content"
                      className="w-full bg-gray-800 text-gray-100 p-2 rounded mb-2 border border-gray-700"
                      rows={3}
                    />
                    <Button onClick={handleAddNewFile} className="bg-blue-600 hover:bg-blue-700 text-white">Add New File</Button>
                  </div>
                  <Button
                    onClick={onPreviewClick}
                    className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Preview Code
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </div>
  );
}

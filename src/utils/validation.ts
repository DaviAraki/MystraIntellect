export const validateApiKey = (key: string): boolean => {
  return /^sk-[A-Za-z0-9]{32,}$/.test(key);
};

export const validateMessage = (message: string): boolean => {
  return message.trim().length > 0 && message.trim().length <= 4000;
};

export const validateModel = (model: string): boolean => {
  return ['gpt-4o-mini', 'gpt-4o'].includes(model);
}; 
export const validateApiKey = (key: string): boolean => {
  // Accept any key that starts with 'sk-' and has a reasonable length
  const isValid = key.startsWith('sk-') && key.length >= 20
  console.log('API Key validation:', {
    startsWithSk: key.startsWith('sk-'),
    length: key.length,
    isValid,
  })
  return isValid
}

export const validateMessage = (message: string): boolean => {
  return message.trim().length > 0 && message.trim().length <= 4000
}

export const validateModel = (model: string): boolean => {
  return [
    'gpt-4o-mini',
    'gpt-4o',
    'qwen-plus',
    'qwen-max',
    'qwen-turbo',
  ].includes(model)
}


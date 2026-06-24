const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Initializes and returns the Google Generative AI client instance.
 * Throws a formatted error if the GEMINI_API_KEY is not defined.
 */
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('GEMINI_API_KEY is missing from the server environment config (.env file).');
    error.status = 400;
    throw error;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Translates Gemini SDK errors into standardized user-friendly responses.
 */
const handleGeminiError = (error) => {
  console.error('Google Gemini Integration Error:', error.message || error);
  const errMsg = error.message || '';
  let status = error.status || 500;
  let message = 'An unexpected error occurred while processing your request with Gemini.';

  if (
    errMsg.includes('API key not valid') || 
    errMsg.includes('key is invalid') || 
    errMsg.includes('API_KEY_INVALID') ||
    errMsg.includes('invalid api key')
  ) {
    status = 401;
    message = 'Invalid Gemini API Key. Please verify the GEMINI_API_KEY variable in your backend environment configuration (.env file).';
  } else if (
    errMsg.includes('429') || 
    errMsg.includes('Quota exceeded') || 
    errMsg.includes('Rate limit') ||
    errMsg.includes('RESOURCE_EXHAUSTED')
  ) {
    status = 429;
    message = 'Google Gemini API quota or rate limit exceeded. Please wait a moment before trying again.';
  } else if (
    errMsg.includes('503') ||
    errMsg.includes('Service Unavailable') ||
    errMsg.includes('experiencing high demand')
  ) {
    status = 503;
    message = 'Google Gemini service is currently experiencing high demand or is temporarily unavailable. Please try again in a few moments.';
  } else if (
    errMsg.includes('fetch failed') || 
    errMsg.includes('network') || 
    errMsg.includes('ENOTFOUND') ||
    errMsg.includes('connect ECONNREFUSED')
  ) {
    status = 502;
    message = 'Network error occurred while connecting to Google Gemini services. Please verify your internet connection.';
  } else if (error.status === 400 || errMsg.includes('400') || errMsg.includes('INVALID_ARGUMENT')) {
    status = 400;
    message = `Bad request received by Google Gemini: ${errMsg || 'Check parameter inputs'}`;
  } else if (errMsg.trim() !== '') {
    message = `Google Gemini Service Error: ${errMsg}`;
  }

  return { status, message };
};

/**
 * Centralized content generation wrapper with automatic retry, exponential backoff,
 * dynamic model selection, and fallback error handling.
 */
const generateContentWithRetry = async (promptOrRequest, modelOptions = {}) => {
  let modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const maxRetries = 3;
  let delay = 1000; // start with 1 second delay
  
  const genAI = getGeminiClient();
  
  // Build dynamic configuration merging user overrides with strict defaults
  const generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 2048,
    ...(modelOptions.generationConfig || {})
  };

  let modelParams = {
    model: modelName,
    ...modelOptions,
    generationConfig
  };

  let model = genAI.getGenerativeModel(modelParams);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let result;
      if (typeof promptOrRequest === 'string' || Array.isArray(promptOrRequest)) {
        result = await model.generateContent(promptOrRequest);
      } else {
        result = await model.generateContent(promptOrRequest);
      }
      
      if (!result || !result.response) {
        throw new Error('Received an empty response from Gemini.');
      }
      
      const text = result.response.text();
      if (!text || text.trim() === '') {
        throw new Error('Received empty text content from Gemini.');
      }
      
      return text;
    } catch (error) {
      console.error(`Gemini call attempt ${attempt} failed: ${error.message}`);
      
      // Self-healing fallback: If the model is not found, dynamically fallback to gemini-2.5-flash
      if (
        (error.message.includes('404') || error.message.includes('not found') || error.status === 404) && 
        modelName === 'gemini-1.5-flash'
      ) {
        console.warn(`Model gemini-1.5-flash not found (404). Dynamically falling back to gemini-2.5-flash.`);
        modelName = 'gemini-2.5-flash';
        modelParams = {
          model: modelName,
          ...modelOptions,
          generationConfig
        };
        model = genAI.getGenerativeModel(modelParams);
        attempt--; // Don't count this fallback attempt against retries
        continue;
      }

      const isRetryable = 
        error.message.includes('429') ||
        error.message.includes('503') ||
        error.message.includes('Quota exceeded') ||
        error.message.includes('Rate limit') ||
        error.message.includes('RESOURCE_EXHAUSTED') ||
        error.message.includes('Service Unavailable') ||
        error.message.includes('fetch failed') ||
        error.message.includes('network') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('connect ECONNREFUSED') ||
        error.status === 503 ||
        error.status === 429;
        
      if (attempt === maxRetries || !isRetryable) {
        // Standardize the final error to friendly user message
        const parsed = handleGeminiError(error);
        const mappedError = new Error(parsed.message);
        mappedError.status = parsed.status;
        throw mappedError;
      }
      
      console.log("Gemini retry attempt:", attempt);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // double the delay
    }
  }
};

module.exports = { getGeminiClient, handleGeminiError, generateContentWithRetry };

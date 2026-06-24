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
  console.error('Google Gemini Integration Error:', error);
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

module.exports = { getGeminiClient, handleGeminiError };

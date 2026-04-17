import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
dotenv.config();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const MODEL_NAME = 'google/gemma-2-2b-it';

/**
 * Get AI response from Hugging Face
 * @param {string} message - User's message
 * @param {Array} history - Conversation history [{role: 'user'|'assistant', content: string}]
 */
export const getAIResponse = async (message, history = []) => {
  try {
    const systemPrompt = "You are an AI sales assistant for a retail business. " +
      "Help users with sales data, inventory management, and business insights. " +
      "Keep responses concise and business-focused.";
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];
    const response = await hf.chatCompletion({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 500
    });

    const aiResponse = response.choices[0]?.message?.content?.trim() || 
      "I'm not sure how to respond to that. Could you rephrase your question?";

    return {
      text: aiResponse,
      metadata: {
        model: MODEL_NAME,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error('Failed to get AI response. Please try again later.');
  }
};

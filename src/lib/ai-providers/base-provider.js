/**
 * Base AI Provider Interface
 * This abstract class defines the interface that all AI providers must implement.
 */
export class BaseAIProvider {
  /**
   * Generate a response from the AI model
   * @param {string} prompt - The prompt to send to the AI model
   * @param {Object} options - Additional options for the AI model
   * @returns {Promise<string>} - The raw response from the AI model
   */
  async generateResponse(prompt, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Parse the raw AI response into a structured format
   * @param {string} rawResponse - The raw response from the AI model
   * @returns {Object} - The parsed response
   */
  parseResponse(rawResponse) {
    throw new Error('Method not implemented');
  }

  /**
   * Generate and parse a response in one step
   * @param {string} prompt - The prompt to send to the AI model
   * @param {Object} options - Additional options for the AI model
   * @returns {Promise<Object>} - The parsed response
   */
  async getResponse(prompt, options = {}) {
    const rawResponse = await this.generateResponse(prompt, options);
    return this.parseResponse(rawResponse);
  }
}
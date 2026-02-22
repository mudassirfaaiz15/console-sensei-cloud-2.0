import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

/**
 * AI Client utility for calling Bedrock and OpenAI with retry logic
 * 
 * Requirements:
 * - 6.1: Integrate with AWS Bedrock Claude model or OpenAI GPT-4
 * - 6.11: Implement retry logic with exponential backoff (max 3 attempts)
 */

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Call Bedrock with exponential backoff retry
 * 
 * @param prompt - The prompt to send to the model
 * @param modelId - The model ID (default: Claude 3 Sonnet)
 * @returns The model response
 */
export async function callBedrockWithRetry(
  prompt: string,
  modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0'
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log('Calling Bedrock', { modelId, attempt });

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-06-01',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      const response = await bedrockClient.send(command);

      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (responseBody.content && responseBody.content.length > 0) {
        const text = responseBody.content[0].text;
        console.log('Bedrock response received', { modelId, textLength: text.length });
        return text;
      }

      throw new Error('No content in Bedrock response');
    } catch (error) {
      lastError = error as Error;
      console.error('Bedrock call failed', { attempt, error: lastError.message });

      if (attempt < MAX_RETRIES - 1) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.log('Retrying after backoff', { backoffMs });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(`Failed to call Bedrock after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Call OpenAI with exponential backoff retry (fallback)
 * 
 * @param prompt - The prompt to send to the model
 * @param apiKey - OpenAI API key
 * @returns The model response
 */
export async function callOpenAIWithRetry(
  prompt: string,
  apiKey: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log('Calling OpenAI', { attempt });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      if (data.choices && data.choices.length > 0) {
        const text = data.choices[0].message.content;
        console.log('OpenAI response received', { textLength: text.length });
        return text;
      }

      throw new Error('No content in OpenAI response');
    } catch (error) {
      lastError = error as Error;
      console.error('OpenAI call failed', { attempt, error: lastError.message });

      if (attempt < MAX_RETRIES - 1) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.log('Retrying after backoff', { backoffMs });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(`Failed to call OpenAI after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

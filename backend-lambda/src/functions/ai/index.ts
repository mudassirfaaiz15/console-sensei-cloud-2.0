import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AIEvent, ApiResponse, AIRecommendation, RiskSummary, PolicyExplanation, ChatResponse, ScanResult } from '../../types';
import { getScanResult } from '../../utils/dynamodb';
import { getAICache, setAICache } from '../../utils/ai-cache';
import { callBedrockWithRetry, callOpenAIWithRetry } from '../../utils/ai-client';

/**
 * AI Lambda Handler
 * 
 * Handles all AI-powered features (cost advisor, risk summary, IAM explainer, chat)
 * 
 * Requirements:
 * - 6.1: Integrate with AWS Bedrock Claude model or OpenAI GPT-4
 * - 6.10: Cache AI recommendations for 24 hours
 * - 6.11: Implement retry logic with exponential backoff
 * 
 * @param event - API Gateway event or direct invocation event
 * @param context - Lambda context
 * @returns API Gateway response
 */
export const handler = async (
  event: APIGatewayProxyEvent | AIEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('AI Lambda invoked', { action: (event as AIEvent).action });

  try {
    const aiEvent = event as AIEvent;
    const { action, data, userId } = aiEvent;

    if (!action || !userId) {
      return createErrorResponse(400, 'INVALID_REQUEST', 'Missing action or userId', context.awsRequestId);
    }

    let result: any;

    switch (action) {
      case 'cost_advisor':
        result = await handleCostAdvisor(data, userId, context.awsRequestId);
        break;
      case 'risk_summary':
        result = await handleRiskSummary(data, userId, context.awsRequestId);
        break;
      case 'iam_explainer':
        result = await handleIAMExplainer(data, userId, context.awsRequestId);
        break;
      case 'chat':
        result = await handleChat(data, userId, context.awsRequestId);
        break;
      default:
        return createErrorResponse(400, 'INVALID_ACTION', `Unknown action: ${action}`, context.awsRequestId);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: result,
      }),
    };
  } catch (error) {
    console.error('Error in AI Lambda:', error);

    return createErrorResponse(
      500,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      (context as any).awsRequestId
    );
  }
};

/**
 * Handle cost advisor action
 * 
 * Requirements:
 * - 6.2: Receive scan results and Cost Explorer data
 * - 6.3: Identify unused resources with estimated savings
 * - 6.4: Suggest right-sizing opportunities
 * - 6.5: Recommend Reserved Instance or Savings Plan purchases
 * - 6.6: Identify opportunities to use cheaper storage classes
 * - 6.7: Provide estimated monthly savings for each recommendation
 * - 6.8: Prioritize recommendations by potential savings amount
 */
async function handleCostAdvisor(data: any, userId: string, requestId: string): Promise<AIRecommendation[]> {
  const { scanId } = data;

  if (!scanId) {
    throw new Error('Missing scanId for cost advisor');
  }

  // Check cache first
  const cacheKey = `cost_advisor_${scanId}`;
  const cached = await getAICache(cacheKey, userId);
  if (cached) {
    console.log('Returning cached cost recommendations', { scanId, cacheKey });
    return cached;
  }

  // Get scan result
  const scanResult = await getScanResult(scanId);
  if (!scanResult) {
    throw new Error(`Scan result not found: ${scanId}`);
  }

  // Format prompt for AI
  const prompt = formatCostAdvisorPrompt(scanResult);

  // Call AI service
  const aiResponse = await callBedrockWithRetry(prompt);

  // Parse recommendations from AI response
  const recommendations = parseCostRecommendations(aiResponse);

  // Sort by savings (descending)
  recommendations.sort((a, b) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0));

  // Cache the recommendations
  await setAICache(cacheKey, userId, recommendations);

  return recommendations;
}

/**
 * Handle risk summary action
 * 
 * Requirements:
 * - 7.1: Generate plain English summary of security issues
 * - 7.2: Categorize issues by severity
 * - 7.3: Explain potential impact of each issue
 * - 7.4: Provide actionable remediation steps
 * - 7.5: Highlight most critical issues
 */
async function handleRiskSummary(data: any, userId: string, requestId: string): Promise<RiskSummary> {
  const { scanId } = data;

  if (!scanId) {
    throw new Error('Missing scanId for risk summary');
  }

  // Check cache first
  const cacheKey = `risk_summary_${scanId}`;
  const cached = await getAICache(cacheKey, userId);
  if (cached) {
    console.log('Returning cached risk summary', { scanId, cacheKey });
    return cached;
  }

  // Get scan result
  const scanResult = await getScanResult(scanId);
  if (!scanResult) {
    throw new Error(`Scan result not found: ${scanId}`);
  }

  // Format prompt for AI
  const prompt = formatRiskSummaryPrompt(scanResult);

  // Call AI service
  const aiResponse = await callBedrockWithRetry(prompt);

  // Parse risk summary from AI response
  const riskSummary = parseRiskSummary(aiResponse);

  // Cache the summary
  await setAICache(cacheKey, userId, riskSummary);

  return riskSummary;
}

/**
 * Handle IAM policy explainer action
 * 
 * Requirements:
 * - 8.1: Parse IAM policy JSON
 * - 8.2: Describe each statement in plain English
 * - 8.3: Identify overly permissive statements
 * - 8.4: Highlight security risks
 * - 8.5: Suggest least-privilege alternatives
 */
async function handleIAMExplainer(data: any, userId: string, requestId: string): Promise<PolicyExplanation> {
  const { policyJson } = data;

  if (!policyJson) {
    throw new Error('Missing policyJson for IAM explainer');
  }

  // Check cache first
  const cacheKey = `iam_explainer_${Buffer.from(policyJson).toString('base64').substring(0, 50)}`;
  const cached = await getAICache(cacheKey, userId);
  if (cached) {
    console.log('Returning cached IAM explanation', { cacheKey });
    return cached;
  }

  // Format prompt for AI
  const prompt = formatIAMExplainerPrompt(policyJson);

  // Call AI service
  const aiResponse = await callBedrockWithRetry(prompt);

  // Parse policy explanation from AI response
  const explanation = parsePolicyExplanation(aiResponse);

  // Cache the explanation
  await setAICache(cacheKey, userId, explanation);

  return explanation;
}

/**
 * Handle chat action
 * 
 * Requirements:
 * - 9.1: Provide chat interface for natural language queries
 * - 9.2: Receive question and current scan results as context
 * - 9.3: Provide accurate answers based on actual AWS resources
 * - 9.4: Cite specific resources in responses
 * - 9.5: Support questions about costs, security, resource counts, configurations
 * - 9.6: Maintain conversation context for follow-up questions
 * - 9.7: Display chat history for current session
 * - 9.8: Implement streaming responses
 * - 9.9: Limit chat history to last 10 messages
 */
async function handleChat(data: any, userId: string, requestId: string): Promise<ChatResponse> {
  const { question, scanId, conversationHistory } = data;

  if (!question) {
    throw new Error('Missing question for chat');
  }

  // Get scan result for context
  let scanResult: ScanResult | null = null;
  if (scanId) {
    scanResult = await getScanResult(scanId);
  }

  // Limit conversation history to last 10 messages
  const limitedHistory = conversationHistory ? conversationHistory.slice(-10) : [];

  // Format prompt for AI with context
  const prompt = formatChatPrompt(question, scanResult, limitedHistory);

  // Call AI service
  const aiResponse = await callBedrockWithRetry(prompt);

  // Parse chat response
  const chatResponse = parseChatResponse(aiResponse, scanResult);

  return chatResponse;
}

/**
 * Format cost advisor prompt
 */
function formatCostAdvisorPrompt(scanResult: ScanResult): string {
  const resourceSummary = scanResult.summary;
  const costData = scanResult.costData;

  return `You are an AWS cost optimization expert. Analyze the following AWS account data and provide specific, actionable cost optimization recommendations.

AWS Account Summary:
- Total Resources: ${resourceSummary.totalResources}
- Resources by Type: ${JSON.stringify(resourceSummary.byType)}
- Resources by Region: ${JSON.stringify(resourceSummary.byRegion)}

Cost Data:
- Estimated Monthly Cost: $${costData?.estimatedMonthly || 0}
- Costs by Service: ${JSON.stringify(costData?.byService || {})}
- Costs by Region: ${JSON.stringify(costData?.byRegion || {})}

Resources:
${scanResult.resources.slice(0, 20).map(r => `- ${r.resourceType} (${r.resourceId}): ${r.state} in ${r.region}`).join('\n')}

Please provide 3-5 specific cost optimization recommendations. For each recommendation, include:
1. Title
2. Description
3. Estimated monthly savings (as a number)
4. Priority (high/medium/low)
5. Affected resources (list resource IDs)
6. Action items (specific steps to implement)

Format your response as a JSON array of recommendations.`;
}

/**
 * Format risk summary prompt
 */
function formatRiskSummaryPrompt(scanResult: ScanResult): string {
  const resourceSummary = scanResult.summary;

  return `You are an AWS security expert. Analyze the following AWS account data and provide a security risk summary.

AWS Account Summary:
- Total Resources: ${resourceSummary.totalResources}
- Resources by Type: ${JSON.stringify(resourceSummary.byType)}

Resources:
${scanResult.resources.slice(0, 20).map(r => `- ${r.resourceType} (${r.resourceId}): ${r.state} in ${r.region}, Tags: ${JSON.stringify(r.tags)}`).join('\n')}

Please provide a comprehensive security risk summary including:
1. Overall summary (2-3 sentences)
2. Critical issues (if any)
3. High severity issues
4. Medium severity issues
5. Low severity issues

For each issue, include:
- Description
- Potential impact
- Remediation steps

Format your response as a JSON object with the structure: { summary: string, criticalIssues: [], highIssues: [], mediumIssues: [], lowIssues: [] }`;
}

/**
 * Format IAM explainer prompt
 */
function formatIAMExplainerPrompt(policyJson: string): string {
  return `You are an AWS IAM security expert. Explain the following IAM policy in plain English, identify any security risks, and suggest improvements.

IAM Policy:
${policyJson}

Please provide:
1. Plain English explanation of what this policy allows
2. For each statement:
   - What it allows
   - Any security risks
3. Overall risk level (critical/high/medium/low)
4. Specific recommendations for least-privilege alternatives

Format your response as a JSON object with the structure: { explanation: string, statements: [{ statement: string, explanation: string, risks: [] }], overallRisk: string, recommendations: [] }`;
}

/**
 * Format chat prompt
 */
function formatChatPrompt(question: string, scanResult: ScanResult | null, conversationHistory: any[]): string {
  let context = '';

  if (scanResult) {
    context = `
Current AWS Account Context:
- Total Resources: ${scanResult.summary.totalResources}
- Resources by Type: ${JSON.stringify(scanResult.summary.byType)}
- Estimated Monthly Cost: $${scanResult.costData?.estimatedMonthly || 0}
- Top Resources: ${scanResult.resources.slice(0, 10).map(r => `${r.resourceType} (${r.resourceId})`).join(', ')}
`;
  }

  let history = '';
  if (conversationHistory && conversationHistory.length > 0) {
    history = `
Previous Conversation:
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
`;
  }

  return `You are Cloud Copilot, an AWS expert assistant. Answer the user's question based on their AWS account context.${context}${history}

User Question: ${question}

Provide a helpful, accurate answer. If referencing specific resources, include their resource IDs. Keep the response concise (2-3 sentences).`;
}

/**
 * Parse cost recommendations from AI response
 */
function parseCostRecommendations(aiResponse: string): AIRecommendation[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((rec: any, index: number) => ({
        id: `cost_rec_${index}`,
        category: 'cost' as const,
        title: rec.title || 'Cost Optimization',
        description: rec.description || '',
        estimatedSavings: parseFloat(rec.estimatedSavings) || 0,
        priority: rec.priority || 'medium',
        affectedResources: rec.affectedResources || [],
        actionItems: rec.actionItems || [],
      }));
    }
  } catch (error) {
    console.error('Failed to parse cost recommendations:', error);
  }

  // Fallback: return empty array
  return [];
}

/**
 * Parse risk summary from AI response
 */
function parseRiskSummary(aiResponse: string): RiskSummary {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || '',
        criticalIssues: parsed.criticalIssues || [],
        highIssues: parsed.highIssues || [],
        mediumIssues: parsed.mediumIssues || [],
        lowIssues: parsed.lowIssues || [],
      };
    }
  } catch (error) {
    console.error('Failed to parse risk summary:', error);
  }

  return {
    summary: aiResponse,
    criticalIssues: [],
    highIssues: [],
    mediumIssues: [],
    lowIssues: [],
  };
}

/**
 * Parse policy explanation from AI response
 */
function parsePolicyExplanation(aiResponse: string): PolicyExplanation {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        explanation: parsed.explanation || '',
        statements: parsed.statements || [],
        overallRisk: parsed.overallRisk || 'medium',
        recommendations: parsed.recommendations || [],
      };
    }
  } catch (error) {
    console.error('Failed to parse policy explanation:', error);
  }

  return {
    explanation: aiResponse,
    statements: [],
    overallRisk: 'medium',
    recommendations: [],
  };
}

/**
 * Parse chat response
 */
function parseChatResponse(aiResponse: string, scanResult: ScanResult | null): ChatResponse {
  const sources: string[] = [];

  // Extract resource IDs mentioned in the response
  if (scanResult) {
    scanResult.resources.forEach(resource => {
      if (aiResponse.includes(resource.resourceId)) {
        sources.push(resource.resourceId);
      }
    });
  }

  return {
    answer: aiResponse,
    sources,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, code: string, message: string, requestId: string): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(response),
  };
}

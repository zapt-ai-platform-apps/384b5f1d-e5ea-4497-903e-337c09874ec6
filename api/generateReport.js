import * as Sentry from "@sentry/node";
import OpenAI from "openai";

Sentry.init({
  dsn: process.env.VITE_PUBLIC_SENTRY_DSN,
  environment: process.env.VITE_PUBLIC_APP_ENV,
  initialScope: {
    tags: {
      type: 'backend',
      projectId: process.env.VITE_PUBLIC_APP_ID
    }
  }
});

export default async function handler(req, res) {
  console.log('Generate report API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectDetails, issues } = req.body;
    
    if (!projectDetails || !issues || !issues.length) {
      console.error('Missing required project details or issues');
      return res.status(400).json({ error: 'Missing required project details or issues' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Construct the prompt for GPT-4o
    const prompt = constructPrompt(projectDetails, issues);
    console.log('Sending prompt to OpenAI');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a UK construction contract expert. Provide detailed, accurate information about construction contract clauses and recommendations based on the given scenario. Use proper formatting with clear headings and paragraphs. Do not use markdown symbols like # or * in your response. Format your text with proper headings, paragraphs, and use bold for emphasis where appropriate."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
    });

    console.log('Received response from OpenAI');
    return res.status(200).json({ report: response.choices[0].message.content });
  } catch (error) {
    console.error('Error in generateReport:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
}

function constructPrompt(projectDetails, issues) {
  const { projectName, projectDescription, formOfContract, organizationRole } = projectDetails;

  let prompt = `Please analyze the following construction contract issue and provide detailed guidance:

Project Name: ${projectName}
Project Description: ${projectDescription}
Form of Contract: ${formOfContract}
Organization Role: ${organizationRole}

Issues to be explored:
`;

  issues.forEach((issue, index) => {
    prompt += `
Issue ${index + 1}: ${issue.description}
Action taken to date: ${issue.actionTaken || 'None'}
`;
  });

  prompt += `
Based on the information provided, please provide:

1. A detailed analysis of the relevant contract clauses that apply to these issues.
2. Specific guidance on what actions should be taken under the relevant clauses.
3. References to all relevant contract clauses with accurate and current details.
4. Any warnings or special considerations based on the role of the organization.

IMPORTANT FORMATTING INSTRUCTIONS:
- Use clear section headings for different parts of your analysis
- Use proper paragraphs with adequate spacing
- Use bold text for important points and emphasis
- DO NOT use markdown symbols like hashtags (#) or asterisks (*) in your response
- Present the information in a clean, professional format suitable for a business document
- Use numbered or bulleted lists where appropriate (written out as "1." or "•" instead of markdown)

Please format your response as a professional document that can be directly printed or shared with clients.`;

  return prompt;
}
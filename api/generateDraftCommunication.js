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
  console.log('Generate draft communication API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectDetails, issues, report } = req.body;
    
    if (!projectDetails || !issues || !issues.length || !report) {
      console.error('Missing required details');
      return res.status(400).json({ error: 'Missing required details' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Construct the prompt for GPT-4o
    const prompt = constructPrompt(projectDetails, issues, report);
    console.log('Sending draft communication prompt to OpenAI');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a UK construction contract expert. Create a professional communication draft based on the details provided. Use proper business letter formatting with clear paragraphs and proper emphasis. Do not use markdown symbols like # or * in your response. Format your text with proper headings, paragraphs, and use appropriate emphasis where needed."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
    });

    console.log('Received draft communication from OpenAI');
    return res.status(200).json({ draftCommunication: response.choices[0].message.content });
  } catch (error) {
    console.error('Error in generateDraftCommunication:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Failed to generate draft communication' });
  }
}

function constructPrompt(projectDetails, issues, report) {
  const { projectName, organizationRole, formOfContract } = projectDetails;

  let prompt = `Please draft a professional communication in UK English format (formal letter or email) regarding the following construction contract issue:

Project Name: ${projectName}
Organization Role: ${organizationRole}
Form of Contract: ${formOfContract}

Issues: 
`;

  issues.forEach((issue, index) => {
    prompt += `
Issue ${index + 1}: ${issue.description}
Action taken to date: ${issue.actionTaken || 'None'}
`;
  });

  prompt += `
The analysis of the issues determined:
${report}

Please create a well-structured, professional communication that:
1. Follows UK business letter/email standards
2. Is formal but clear
3. References the relevant contract clauses
4. States the position based on the above analysis
5. Proposes specific next steps or requests
6. Maintains a professional tone throughout

IMPORTANT FORMATTING INSTRUCTIONS:
- DO NOT use markdown formatting such as hashtags (#) or asterisks (*) in your response
- Use proper business letter or email formatting with appropriate paragraphs
- Use headings and emphasis appropriately without markdown symbols
- Format the document so it's immediately ready to print or send
- Include all necessary parts of a formal business letter (date, address, salutation, etc.)
- Use clear paragraph breaks for readability

Format it as a ready-to-use professional communication that I can send directly.`;

  return prompt;
}
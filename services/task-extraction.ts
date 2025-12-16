const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

export interface ExtractedTask {
  title: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface TaskExtractionResult {
  tasks: ExtractedTask[];
  originalText: string;
}

const getTaskExtractionPrompt = (language: string) => {
  const languageInstruction = language === 'fr' 
    ? 'IMPORTANT: Return all task titles in FRENCH language.'
    : language === 'ar'
    ? 'IMPORTANT: Return all task titles in ARABIC language.'
    : 'IMPORTANT: Return all task titles in ENGLISH language.';

  return `You are an expert productivity assistant.
Your job is to convert messy spoken thoughts into clear, actionable tasks.

${languageInstruction}

Rules:
- Extract only real, actionable tasks.
- Ignore commentary, reflections, or non-action statements.
- Split compound thoughts into separate tasks.
- Infer reasonable due dates when time references exist.
- Do NOT invent tasks.
- Do NOT add explanations.
- Output valid JSON only.
- Task titles MUST be in the same language as the input text.

Output format:
{
  "tasks": [
    {
      "title": "Clear task description in the correct language",
      "dueDate": "YYYY-MM-DD or null",
      "priority": "low|medium|high"
    }
  ]
}`;
};

export async function extractTasksFromText(text: string, language: string = 'en'): Promise<TaskExtractionResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file');
  }

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: getTaskExtractionPrompt(language),
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from ChatGPT');
    }

    const parsed = JSON.parse(content);
    const tasks = parsed.tasks || [];

    return {
      tasks,
      originalText: text,
    };
  } catch (error) {
    console.error('Task extraction error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to extract tasks'
    );
  }
}

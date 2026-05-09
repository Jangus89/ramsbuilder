import { callOpenAIChat } from './openaiClient';

export async function analysePhoto(photoUrl) {
  try {
    const data = await callOpenAIChat({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: photoUrl, detail: 'low' } },
            {
              type: 'text',
              text: 'You are reviewing a site photo for a RAMS document. List exactly 3 brief bullet points of visible hazards, risks, or site conditions relevant to safe working. Be specific to what is visible. Format: plain text, one bullet per line, starting with •',
            },
          ],
        },
      ],
    });
    const text = data.choices?.[0]?.message?.content || '';
    return text
      .split('•')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

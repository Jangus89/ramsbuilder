import { callOpenAIChat, parseJsonResponse } from './openaiClient';

async function resizeImageDataUrl(dataUrl, maxDimension = 900, quality = 0.78) {
  if (typeof window === 'undefined' || typeof Image === 'undefined' || !dataUrl?.startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const largest = Math.max(img.width, img.height);
      if (!largest || largest <= maxDimension) {
        resolve(dataUrl);
        return;
      }

      const scale = maxDimension / largest;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function normaliseHazards(parsed) {
  const hazards = Array.isArray(parsed)
    ? parsed
    : parsed?.hazards || parsed?.observations || parsed?.risks || [];

  return hazards
    .map(item => (typeof item === 'string' ? item : item?.text || item?.hazard || ''))
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function fallbackHazards(text) {
  return text
    .split('\n')
    .map(line => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

export async function analysePhoto(photoUrl) {
  const preparedPhoto = await resizeImageDataUrl(photoUrl);
  const data = await callOpenAIChat({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 180,
    messages: [
      {
        role: 'system',
        content: 'You are a UK construction safety reviewer. Identify only visible site conditions or hazards from the supplied photo. Do not invent unseen risks.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Return ONLY valid JSON in this shape: {"hazards":["short observation","short observation","short observation"]}. Keep each item concise and RAMS-relevant.',
          },
          {
            type: 'image_url',
            image_url: { url: preparedPhoto, detail: 'low' },
          },
        ],
      },
    ],
  });

  const raw = data.choices?.[0]?.message?.content || '';

  try {
    const hazards = normaliseHazards(parseJsonResponse(raw));
    if (hazards.length > 0) return hazards;
  } catch {
    const hazards = fallbackHazards(raw);
    if (hazards.length > 0) return hazards;
  }

  return ['No clear photo-specific hazards were identified.'];
}

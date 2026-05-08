export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt' || ext === 'md') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  if (ext === 'pdf') {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  }

  if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }

  throw new Error(`Unsupported file type .${ext} — use .txt, .pdf, or .docx`);
}

export function filterRelevantProcedures(procedures, taskType) {
  if (!procedures.length || !taskType) return procedures;
  const task = taskType.toLowerCase();
  const scored = procedures.map(p => {
    if (!p.category) return { p, score: 1 }; // "all tasks" always included
    const haystack = `${p.title} ${p.category}`.toLowerCase();
    const words = haystack.split(/\s+/).filter(w => w.length > 3);
    const hits = words.filter(w => task.includes(w) || w.includes(task.split(' ')[0])).length;
    return { p, score: hits };
  });
  // return all "all tasks" procedures plus top-scoring specific ones
  return scored.filter(x => x.score > 0).map(x => x.p);
}

export function injectProceduresIntoPrompt(procedures, taskType, charBudget = 12000) {
  const relevant = filterRelevantProcedures(procedures, taskType);
  if (relevant.length === 0) return '';

  const perProc = Math.floor(charBudget / Math.min(relevant.length, 5));
  const top = relevant.slice(0, 5); // max 5 procedures
  const blocks = top.map(p => {
    const text = p.text.length > perProc
      ? p.text.slice(0, perProc) + '\n[truncated — full document in procedure library]'
      : p.text;
    return `[${p.code || 'PROC'}] ${p.title}:\n${text}`;
  });

  return '\n\nCOMPANY PROCEDURES — the RAMS MUST comply with and explicitly reference these by document code:\n\n' +
    blocks.join('\n\n---\n\n');
}

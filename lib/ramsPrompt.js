import { injectProfileIntoPrompt } from './companyProfile';
import { injectProceduresIntoPrompt } from './procedureLibrary';
import { filterGuidanceForTask } from './hseGuidance';
import { filterCriticalRules, buildMandatoryHazardsBlock } from './criticalRiskRules';

const JSON_SCHEMA = `{
  "taskType": "Task type",
  "location": "Site location",
  "scopeOfWorks": "2-3 sentences describing the full scope of the works to be undertaken",
  "siteObservations": "3-5 sentences describing observed or confirmed site conditions: ground conditions, access, proximity hazards, environmental factors, existing infrastructure, overhead/underground services visible or confirmed, and specific risk factors",
  "hazards": [
    {
      "hazard": "Hazard name",
      "thoseAtRisk": "Who is at risk",
      "initialLikelihood": 4,
      "initialSeverity": 4,
      "initialRisk": "High|Medium|Low",
      "controls": "Specific control measures to reduce this risk",
      "residualLikelihood": 2,
      "residualSeverity": 3,
      "residualRisk": "High|Medium|Low"
    }
  ],
  "methodStatement": "Step-by-step method statement as a numbered sequence. Each step on a new line starting with the step number. Minimum 8 steps covering: pre-task checks, site setup, task execution sequence, quality checks, and demobilisation.",
  "ppe": ["PPE item 1", "PPE item 2", "PPE item 3"],
  "welfareArrangements": "Welfare facilities available on site under CDM 2015 Regulation 13: toilets, washing facilities with hot/cold water and soap, rest area, drinking water supply, changing facilities if required, and facility for warming food. Include responsibilities for maintaining welfare standards throughout the works.",
  "environmentalControls": "Environmental controls under Environmental Protection Act 1990 and site-specific requirements: spill containment measures, noise and vibration management, dust suppression, waste segregation and disposal routes, fuel and oil storage requirements, protection of watercourses and drainage, and any required environmental monitoring.",
  "coshhAssessment": "COSHH assessment under COSHH Regulations 2002: list each hazardous substance used or potentially encountered (fuels, lubricants, dust, chemicals, exhaust fumes), route of exposure, health effects, and control measures. If no COSHH hazards are identified, state explicitly.",
  "refuellingProcedure": "Step-by-step refuelling procedure for plant and equipment on site. Cover: approved fuel storage location, minimum separation distances, spill kit location and use, no-smoking and no-ignition-source zone, earthing requirements where applicable, correct PPE for refuelling, prohibition on refuelling with engine running, disposal of contaminated absorbent materials, and emergency procedure in event of fuel spill.",
  "trainingRequirements": ["Training/certification requirement 1", "Training/certification requirement 2"],
  "emergencyArrangements": "Clear emergency arrangements: nearest A&E hospital with full name and address based on the site location provided, emergency services (999), site emergency contact name and number, first aid provision and location of first aid kit, name of nearest first aider on site, emergency assembly point, RIDDOR reportable incident procedure, and actions to take if a worker is injured.",
  "competencies": "Required certifications, qualifications, training, and experience for operatives undertaking this work under UK legislation and industry standards",
  "reviewDate": "This document should be reviewed within 12 months of issue, or immediately if scope of works changes, an incident occurs, or new hazards are identified",
  "references": [
    { "title": "Exact title from the HSE Guidance list above", "url": "https://exact-url-from-list" }
  ]
}`;

function answerLines(answers) {
  return Object.values(answers || {})
    .map(value => `- ${value.question}: ${value.answer}`)
    .join('\n');
}

export function buildStructuredAnswersContext(answers) {
  if (!answers || Object.keys(answers).length === 0) {
    return { scopeOfWorks: '', siteObservations: '', hazards: '', all: '' };
  }

  const groups = { scopeOfWorks: [], siteObservations: [], hazards: [] };
  Object.values(answers).forEach(value => {
    const text = `${value.question || ''} ${value.answer || ''}`.toLowerCase();
    const line = `- ${value.question}: ${value.answer}`;
    if (/(duration|shift|day|week|hours|crew|operatives|scale|length|area|quantity|programme|phase)/.test(text)) {
      groups.scopeOfWorks.push(line);
    } else if (/(plant|equipment|machine|tool|excavator|dumper|saw|breaker|crane|vehicle|material)/.test(text)) {
      groups.hazards.push(line);
    } else {
      groups.siteObservations.push(line);
    }
  });

  return {
    scopeOfWorks: groups.scopeOfWorks.join('\n'),
    siteObservations: groups.siteObservations.join('\n'),
    hazards: groups.hazards.join('\n'),
    all: answerLines(answers),
  };
}

export function buildRamsMessages({
  task,
  taskType,
  customTask = '',
  location = '',
  additionalInfo = '',
  hasPhotos = false,
  answers = {},
  profile = {},
  procedures = [],
}) {
  const guidance = filterGuidanceForTask(task, 14);
  const criticalRules = filterCriticalRules({
    taskType: task,
    taskDescription: customTask,
    additionalInfo,
    answers,
  });
  const structuredAnswers = buildStructuredAnswersContext(answers);

  const guidanceBlock = guidance.length
    ? `\nRELEVANT HSE GUIDANCE (select the most applicable for the references field):\n${guidance.map(g => `- ${g.title}: ${g.url}`).join('\n')}\n`
    : '';

  const system = `You are an expert HSQE Manager with 15+ years of experience producing Risk Assessment and Method Statements (RAMS) for UK field contractors.

Return ONLY a valid JSON object, no preamble, no markdown.

Rules:
- Produce a comprehensive, legally significant UK construction RAMS.
- Produce at least 6 hazards.
- Use the 5x5 risk matrix: Likelihood (1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain) x Severity (1=Negligible, 2=Minor, 3=Moderate, 4=Major, 5=Catastrophic) = Risk Rating (1-6=Low, 7-14=Medium, 15-25=High).
- Every residual risk score must be lower than its initial risk score unless a hazard is already Low and cannot be reduced further; explain controls accordingly.
- Reference relevant UK regulations such as HASAWA 1974, MHSWR 1999, CDM 2015, RIDDOR, COSHH 2002, Environmental Protection Act 1990.
- PPE minimum 6 items.
- trainingRequirements must list each individual certification, competency card, or course required, one item per entry.
- For references, select 4-8 HSE documents from the supplied list using exact titles and URLs.
${buildMandatoryHazardsBlock(criticalRules)}

JSON schema to return:
${JSON_SCHEMA}`;

  const user = `Generate the RAMS from these job-specific details.

Task Type: ${task}
${customTask.trim() && taskType !== 'Other (describe below)' ? `Task Description: ${customTask.trim()}` : ''}
${location ? `Site Location: ${location}` : ''}
${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}
${!hasPhotos ? 'Site Photos: None provided. Do not invent visual observations. State assumptions and site checks required before works begin.' : ''}

Confirmed answers for scopeOfWorks:
${structuredAnswers.scopeOfWorks || 'None'}

Confirmed answers for siteObservations:
${structuredAnswers.siteObservations || 'None'}

Confirmed answers for hazards:
${structuredAnswers.hazards || 'None'}

All confirmed answers:
${structuredAnswers.all || 'None'}

${injectProfileIntoPrompt(profile)}
${injectProceduresIntoPrompt(procedures, task)}
${guidanceBlock}
${hasPhotos
  ? 'Analyse the site photos carefully and identify visible hazards, site conditions, environmental factors, and anything relevant to safe working.'
  : 'Analyse the written job details and identify likely hazards, verification checks, environmental factors, and anything relevant to safe working.'}`;

  return {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    criticalRules,
  };
}

export function buildRamsPrompt(args) {
  return buildRamsMessages(args).messages.map(message => `${message.role.toUpperCase()}:\n${message.content}`).join('\n\n');
}

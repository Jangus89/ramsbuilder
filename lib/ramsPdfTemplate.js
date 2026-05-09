function buildPdfStyles(brandColour = '#0b7a53') {
  const bc = brandColour || '#0b7a53';
  return `
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    color: #16181d;
    background: #fff;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    line-height: 1.55;
    margin: 0 auto;
    max-width: 1040px;
    padding: 36px;
  }
  .cover {
    border-bottom: 3px solid ${bc};
    display: grid;
    gap: 18px;
    grid-template-columns: 1fr auto;
    margin-bottom: 26px;
    padding-bottom: 22px;
  }
  .eyebrow {
    color: ${bc};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    margin-bottom: 7px;
    text-transform: uppercase;
  }
  h1 {
    font-size: 26px;
    line-height: 1.15;
    margin: 0;
  }
  .status {
    align-self: start;
    background: #fff7da;
    border: 1px solid #e0b02d;
    border-radius: 4px;
    color: #6f4e00;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 7px 10px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .meta-grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(4, 1fr);
    margin-bottom: 24px;
  }
  .meta-item {
    border: 1px solid #dde2e8;
    border-radius: 6px;
    min-height: 58px;
    padding: 9px 10px;
  }
  .meta-label {
    color: #6b7280;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .meta-value {
    color: #111827;
    font-size: 12px;
    font-weight: 600;
  }
  .section {
    break-inside: avoid;
    margin-bottom: 22px;
  }
  .section-title {
    align-items: center;
    color: ${bc};
    display: flex;
    font-size: 10px;
    font-weight: 800;
    gap: 10px;
    letter-spacing: 0.1em;
    margin-bottom: 9px;
    text-transform: uppercase;
  }
  .section-title::after {
    background: #dde2e8;
    content: '';
    flex: 1;
    height: 1px;
  }
  p, pre {
    color: #2f3742;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }
  table {
    border-collapse: collapse;
    font-size: 11px;
    table-layout: fixed;
    width: 100%;
  }
  th {
    background: #f3f6f8;
    border-bottom: 2px solid #d8dee6;
    color: #4b5563;
    font-size: 9px;
    letter-spacing: 0.06em;
    padding: 8px;
    text-align: left;
    text-transform: uppercase;
  }
  td {
    border-bottom: 1px solid #e8edf2;
    color: #2f3742;
    line-height: 1.45;
    padding: 8px;
    vertical-align: top;
    word-break: break-word;
  }
  .risk-pill {
    border-radius: 3px;
    display: inline-block;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
    padding: 2px 7px;
    text-transform: uppercase;
  }
  .risk-high { background: #fee2e2; color: #b91c1c; }
  .risk-medium { background: #fef3c7; color: #a16207; }
  .risk-low { background: #dcfce7; color: #047857; }
  .score {
    color: #6b7280;
    font-size: 10px;
  }
  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    background: #f6f8fa;
    border: 1px solid #dde2e8;
    border-radius: 4px;
    color: #27313d;
    font-size: 11px;
    padding: 5px 9px;
  }
  .refs {
    display: grid;
    gap: 5px;
  }
  .ref {
    border-left: 3px solid ${bc};
    color: #2f3742;
    font-size: 11px;
    padding: 4px 0 4px 8px;
  }
  .sign-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(3, 1fr);
  }
  .sign-box {
    border: 1px solid #d8dee6;
    border-radius: 6px;
    min-height: 120px;
    padding: 10px;
  }
  .sign-label {
    color: #4b5563;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
  .line {
    border-top: 1px solid #cfd7e1;
    margin-top: 18px;
    padding-top: 4px;
  }
  @media print {
    body { max-width: none; padding: 0; }
  }
`;
}

function textEl(doc, tag, text, className) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  el.textContent = text || '';
  return el;
}

function riskClass(value) {
  const safe = String(value || '').toLowerCase();
  return ['high', 'medium', 'low'].includes(safe) ? `risk-${safe}` : 'risk-medium';
}

function addSection(doc, body, title, content, tag = 'p') {
  if (!content) return;
  const section = doc.createElement('section');
  section.className = 'section';
  section.appendChild(textEl(doc, 'div', title, 'section-title'));
  section.appendChild(textEl(doc, tag, content));
  body.appendChild(section);
}

function addChipSection(doc, body, title, items = []) {
  if (!items.length) return;
  const section = doc.createElement('section');
  section.className = 'section';
  section.appendChild(textEl(doc, 'div', title, 'section-title'));
  const grid = doc.createElement('div');
  grid.className = 'chip-grid';
  items.forEach(item => grid.appendChild(textEl(doc, 'div', item, 'chip')));
  section.appendChild(grid);
  body.appendChild(section);
}

function addMeta(doc, grid, label, value) {
  const item = doc.createElement('div');
  item.className = 'meta-item';
  item.appendChild(textEl(doc, 'div', label, 'meta-label'));
  item.appendChild(textEl(doc, 'div', value || 'Not specified', 'meta-value'));
  grid.appendChild(item);
}

function addHazardTable(doc, body, hazards = []) {
  if (!hazards.length) return;
  const section = doc.createElement('section');
  section.className = 'section';
  section.appendChild(textEl(doc, 'div', 'Hazard Register & Risk Assessment', 'section-title'));
  const table = doc.createElement('table');
  const colgroup = doc.createElement('colgroup');
  ['18%', '14%', '13%', '42%', '13%'].forEach(width => {
    const col = doc.createElement('col');
    col.style.width = width;
    colgroup.appendChild(col);
  });
  table.appendChild(colgroup);
  const head = doc.createElement('thead');
  const headRow = doc.createElement('tr');
  ['Hazard', 'Those at Risk', 'Initial Risk', 'Controls', 'Residual Risk'].forEach(label => headRow.appendChild(textEl(doc, 'th', label)));
  head.appendChild(headRow);
  table.appendChild(head);
  const bodyRows = doc.createElement('tbody');
  hazards.forEach(hazard => {
    const row = doc.createElement('tr');
    row.appendChild(textEl(doc, 'td', hazard.hazard));
    row.appendChild(textEl(doc, 'td', hazard.thoseAtRisk));
    const initial = doc.createElement('td');
    initial.appendChild(textEl(doc, 'span', hazard.initialRisk, `risk-pill ${riskClass(hazard.initialRisk)}`));
    if (hazard.initialLikelihood && hazard.initialSeverity) {
      initial.appendChild(textEl(doc, 'div', `${hazard.initialLikelihood} × ${hazard.initialSeverity} = ${hazard.initialLikelihood * hazard.initialSeverity}`, 'score'));
    }
    row.appendChild(initial);
    row.appendChild(textEl(doc, 'td', hazard.controls));
    const residual = doc.createElement('td');
    residual.appendChild(textEl(doc, 'span', hazard.residualRisk, `risk-pill ${riskClass(hazard.residualRisk)}`));
    if (hazard.residualLikelihood && hazard.residualSeverity) {
      residual.appendChild(textEl(doc, 'div', `${hazard.residualLikelihood} × ${hazard.residualSeverity} = ${hazard.residualLikelihood * hazard.residualSeverity}`, 'score'));
    }
    row.appendChild(residual);
    bodyRows.appendChild(row);
  });
  table.appendChild(bodyRows);
  section.appendChild(table);
  body.appendChild(section);
}

function addReferences(doc, body, references = []) {
  if (!references.length) return;
  const section = doc.createElement('section');
  section.className = 'section';
  section.appendChild(textEl(doc, 'div', 'References', 'section-title'));
  const refs = doc.createElement('div');
  refs.className = 'refs';
  references.forEach(ref => refs.appendChild(textEl(doc, 'div', `${ref.title || 'Reference'}${ref.url ? ` — ${ref.url}` : ''}`, 'ref')));
  section.appendChild(refs);
  body.appendChild(section);
}

function addSignOff(doc, body) {
  const section = doc.createElement('section');
  section.className = 'section';
  section.appendChild(textEl(doc, 'div', 'Sign-off', 'section-title'));
  const grid = doc.createElement('div');
  grid.className = 'sign-grid';
  ['Prepared by', 'Reviewed by', 'Authorised by'].forEach(label => {
    const box = doc.createElement('div');
    box.className = 'sign-box';
    box.appendChild(textEl(doc, 'div', label, 'sign-label'));
    ['Name', 'Role', 'Date', 'Signature'].forEach(field => box.appendChild(textEl(doc, 'div', field, 'line')));
    grid.appendChild(box);
  });
  section.appendChild(grid);
  body.appendChild(section);
}

export function populateRamsPdfTemplate(doc, ramsData, { profile = {}, refNum, issueDate } = {}) {
  doc.title = 'RAMS Document';
  doc.head.innerHTML = '';
  doc.body.innerHTML = '';
  const brandColour = profile.brandColour || '#0b7a53';
  const style = doc.createElement('style');
  style.textContent = buildPdfStyles(brandColour);
  doc.head.appendChild(style);

  const cover = doc.createElement('header');
  cover.className = 'cover';
  const titleBlock = doc.createElement('div');
  titleBlock.appendChild(textEl(doc, 'div', 'Risk Assessment & Method Statement', 'eyebrow'));
  titleBlock.appendChild(textEl(doc, 'h1', ramsData.taskType || 'RAMS Document'));
  cover.appendChild(titleBlock);
  const coverRight = doc.createElement('div');
  coverRight.style.display = 'flex';
  coverRight.style.flexDirection = 'column';
  coverRight.style.alignItems = 'flex-end';
  coverRight.style.gap = '10px';
  if (profile.logoUrl) {
    const logo = doc.createElement('img');
    logo.src = profile.logoUrl;
    logo.alt = 'Company logo';
    logo.style.maxHeight = '56px';
    logo.style.maxWidth = '160px';
    logo.style.objectFit = 'contain';
    coverRight.appendChild(logo);
  }
  coverRight.appendChild(textEl(doc, 'div', 'Draft - Review Required', 'status'));
  cover.appendChild(coverRight);
  doc.body.appendChild(cover);

  const meta = doc.createElement('div');
  meta.className = 'meta-grid';
  addMeta(doc, meta, 'Reference', refNum);
  addMeta(doc, meta, 'Issue Date', issueDate);
  addMeta(doc, meta, 'Location', ramsData.location || 'As surveyed');
  addMeta(doc, meta, 'Contractor', profile.companyName || 'Not specified');
  addMeta(doc, meta, 'Site Manager', profile.siteManagerName || 'Not specified');
  addMeta(doc, meta, 'Supervisor', profile.supervisorName || 'Not specified');
  addMeta(doc, meta, 'First Aider', profile.firstAiderName || 'Not specified');
  addMeta(doc, meta, 'Review', ramsData.reviewDate || '12 months or sooner if conditions change');
  doc.body.appendChild(meta);

  addSection(doc, doc.body, 'Scope of Works', ramsData.scopeOfWorks);
  addSection(doc, doc.body, 'Site Observations', ramsData.siteObservations);
  addHazardTable(doc, doc.body, ramsData.hazards || []);
  addSection(doc, doc.body, 'Method Statement', ramsData.methodStatement, 'pre');
  addChipSection(doc, doc.body, 'Personal Protective Equipment', ramsData.ppe || []);
  addChipSection(doc, doc.body, 'Training Requirements', ramsData.trainingRequirements || []);
  addSection(doc, doc.body, 'Emergency Arrangements', ramsData.emergencyArrangements, 'pre');
  addSection(doc, doc.body, 'Competencies Required', ramsData.competencies);
  addSection(doc, doc.body, 'Welfare Arrangements', ramsData.welfareArrangements, 'pre');
  addSection(doc, doc.body, 'Environmental Controls', ramsData.environmentalControls, 'pre');
  addSection(doc, doc.body, 'COSHH Assessment', ramsData.coshhAssessment, 'pre');
  addSection(doc, doc.body, 'Refuelling Procedure', ramsData.refuellingProcedure, 'pre');
  addReferences(doc, doc.body, ramsData.references || []);
  addSignOff(doc, doc.body);
}

export async function downloadSampleTemplate() {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, ShadingType,
  } = await import('docx');

  const tag = (text) => new TextRun({ text, color: '0a7c4e', size: 18, bold: true });
  const note = (text) => new TextRun({ text, color: '999999', size: 16, italics: true });
  const body = (text) => new TextRun({ text, size: 20 });

  const sec = (title) => new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 22, color: '0a7c4e' })],
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: 'single', size: 6, color: 'e5e7eb' } },
  });

  const tagPara = (text, note_text) => new Paragraph({
    children: [
      tag(text),
      ...(note_text ? [new TextRun({ text: `  ← ${note_text}`, color: 'aaaaaa', size: 14, italics: true })] : []),
    ],
    spacing: { after: 80 },
  });

  const metaRow = (label, placeholder) => new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: 'f9fafb' },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [tag(placeholder)] })],
      }),
    ],
  });

  const doc = new Document({
    sections: [{
      children: [
        // Title block
        new Paragraph({
          children: [new TextRun({ text: 'RISK ASSESSMENT & METHOD STATEMENT', bold: true, size: 36 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [note('[Add your company name and logo above this line — delete this note]')],
          alignment: AlignmentType.CENTER,
          spacing: { after: 320 },
        }),

        // Placeholder guide note
        new Paragraph({
          children: [note('TEMPLATE GUIDE: Green {tags} are filled automatically. Do not edit the tag text. Style everything else freely.')],
          spacing: { after: 240 },
          border: { top: { style: 'single', size: 6, color: '0a7c4e' }, bottom: { style: 'single', size: 6, color: '0a7c4e' } },
        }),

        // Document info table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            metaRow('Task Type', '{task_type}'),
            metaRow('Reference', '{ref_number}'),
            metaRow('Date Issued', '{date}'),
            metaRow('Location', '{location}'),
            metaRow('Contractor', '{company_name}'),
            metaRow('Address', '{company_address}'),
            metaRow('Site Manager', '{site_manager_name}  |  {site_manager_phone}'),
            metaRow('Supervisor', '{supervisor_name}  |  {supervisor_phone}'),
            metaRow('First Aider', '{first_aider_name}  |  {first_aider_phone}'),
            metaRow('Review By', '{review_date}'),
          ],
        }),

        new Paragraph({
          children: [new TextRun({ text: '⚠ DRAFT — REVIEW AND SIGN-OFF REQUIRED BEFORE USE', bold: true, size: 18, color: 'd97706' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 280, after: 280 },
        }),

        sec('SCOPE OF WORKS'),
        tagPara('{scope_of_works}'),

        sec('SITE OBSERVATIONS'),
        tagPara('{site_observations}'),

        sec('HAZARD REGISTER & RISK ASSESSMENT'),
        new Paragraph({ children: [note('The row below repeats once per hazard. {#hazards} opens the loop, {/hazards} closes it.')], spacing: { after: 120 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ shading: { type: ShadingType.SOLID, color: 'f3f4f6' }, children: [new Paragraph({ children: [new TextRun({ text: 'Hazard', bold: true, size: 16 })] })] }),
                new TableCell({ shading: { type: ShadingType.SOLID, color: 'f3f4f6' }, children: [new Paragraph({ children: [new TextRun({ text: 'Those at Risk', bold: true, size: 16 })] })] }),
                new TableCell({ shading: { type: ShadingType.SOLID, color: 'f3f4f6' }, children: [new Paragraph({ children: [new TextRun({ text: 'Initial Risk (L×S)', bold: true, size: 16 })] })] }),
                new TableCell({ shading: { type: ShadingType.SOLID, color: 'f3f4f6' }, children: [new Paragraph({ children: [new TextRun({ text: 'Control Measures', bold: true, size: 16 })] })] }),
                new TableCell({ shading: { type: ShadingType.SOLID, color: 'f3f4f6' }, children: [new Paragraph({ children: [new TextRun({ text: 'Residual Risk (L×S)', bold: true, size: 16 })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [tag('{#hazards}{hazard}')] })] }),
                new TableCell({ children: [new Paragraph({ children: [tag('{those_at_risk}')] })] }),
                new TableCell({ children: [new Paragraph({ children: [tag('{initial_risk} ({initial_l}×{initial_s}={initial_score})')] })] }),
                new TableCell({ children: [new Paragraph({ children: [tag('{controls}')] })] }),
                new TableCell({ children: [new Paragraph({ children: [tag('{residual_risk} ({residual_l}×{residual_s}={residual_score}){/hazards}')] })] }),
              ],
            }),
          ],
        }),

        sec('METHOD STATEMENT'),
        tagPara('{method_statement}'),

        sec('PERSONAL PROTECTIVE EQUIPMENT'),
        new Paragraph({ children: [note('The line below repeats once per PPE item.')], spacing: { after: 80 } }),
        new Paragraph({ children: [tag('{#ppe}')], spacing: { after: 40 } }),
        new Paragraph({ children: [body('•  '), tag('{item}')], spacing: { after: 40 } }),
        new Paragraph({ children: [tag('{/ppe}')], spacing: { after: 80 } }),

        sec('TRAINING REQUIREMENTS'),
        new Paragraph({ children: [note('The line below repeats once per training requirement.')], spacing: { after: 80 } }),
        new Paragraph({ children: [tag('{#training_requirements}')], spacing: { after: 40 } }),
        new Paragraph({ children: [body('•  '), tag('{item}')], spacing: { after: 40 } }),
        new Paragraph({ children: [tag('{/training_requirements}')], spacing: { after: 80 } }),

        sec('WELFARE ARRANGEMENTS'),
        tagPara('{welfare_arrangements}'),

        sec('ENVIRONMENTAL CONTROLS'),
        tagPara('{environmental_controls}'),

        sec('COSHH ASSESSMENT'),
        tagPara('{coshh_assessment}'),

        sec('REFUELLING PROCEDURE'),
        tagPara('{refuelling_procedure}'),

        sec('EMERGENCY ARRANGEMENTS'),
        tagPara('{emergency_arrangements}'),

        sec('COMPETENCIES REQUIRED'),
        tagPara('{competencies}'),

        sec('SIGN-OFF'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: ['PREPARED BY', 'REVIEWED BY', 'AUTHORISED BY'].map(label =>
                new TableCell({
                  shading: { type: ShadingType.SOLID, color: 'f3f4f6' },
                  children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 16 })] })],
                })
              ),
            }),
            new TableRow({
              children: ['', '', ''].map(() =>
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Name:', size: 18 })], spacing: { after: 280 } }),
                    new Paragraph({ children: [new TextRun({ text: 'Role:', size: 18 })], spacing: { after: 280 } }),
                    new Paragraph({ children: [new TextRun({ text: 'Date:', size: 18 })], spacing: { after: 560 } }),
                    new Paragraph({ children: [new TextRun({ text: 'Signature:', size: 18 })], spacing: { after: 80 } }),
                  ],
                })
              ),
            }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SafeFlow-RAMS-Sample-Template.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

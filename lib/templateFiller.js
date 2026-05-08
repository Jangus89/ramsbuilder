export async function fillTemplate(templateArrayBuffer, ramsData, profile, refNum) {
  const [PizZip, { default: Docxtemplater }] = await Promise.all([
    import('pizzip').then(m => m.default),
    import('docxtemplater'),
  ]);

  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const templateData = {
    task_type:             ramsData.taskType || '',
    location:              ramsData.location || '',
    ref_number:            refNum,
    date,
    review_date:           ramsData.reviewDate || '12 months from date of issue',
    company_name:          profile.companyName || '',
    company_address:       profile.companyAddress || '',
    site_manager_name:     profile.siteManagerName || '',
    site_manager_phone:    profile.siteManagerPhone || '',
    supervisor_name:       profile.supervisorName || '',
    supervisor_phone:      profile.supervisorPhone || '',
    first_aider_name:      profile.firstAiderName || '',
    first_aider_phone:     profile.firstAiderPhone || '',
    scope_of_works:        ramsData.scopeOfWorks || '',
    site_observations:     ramsData.siteObservations || '',
    method_statement:      ramsData.methodStatement || '',
    emergency_arrangements: ramsData.emergencyArrangements || '',
    competencies:          ramsData.competencies || '',
    welfare_arrangements:  ramsData.welfareArrangements || '',
    environmental_controls: ramsData.environmentalControls || '',
    coshh_assessment:      ramsData.coshhAssessment || '',
    refuelling_procedure:  ramsData.refuellingProcedure || '',
    hazards: (ramsData.hazards || []).map(h => ({
      hazard:         h.hazard,
      those_at_risk:  h.thoseAtRisk,
      initial_risk:   h.initialRisk,
      initial_l:      h.initialLikelihood || '',
      initial_s:      h.initialSeverity || '',
      initial_score:  h.initialLikelihood && h.initialSeverity ? String(h.initialLikelihood * h.initialSeverity) : '',
      controls:       h.controls,
      residual_risk:  h.residualRisk,
      residual_l:     h.residualLikelihood || '',
      residual_s:     h.residualSeverity || '',
      residual_score: h.residualLikelihood && h.residualSeverity ? String(h.residualLikelihood * h.residualSeverity) : '',
    })),
    ppe:                  (ramsData.ppe || []).map(item => ({ item })),
    training_requirements: (ramsData.trainingRequirements || []).map(item => ({ item })),
  };

  const zip = new PizZip(templateArrayBuffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(templateData);

  return doc.getZip().generate({
    type: 'arraybuffer',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

export function downloadFile(arrayBuffer, filename, mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  const blob = new Blob([arrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

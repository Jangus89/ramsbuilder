export const DEFAULT_PROFILE = {
  companyName: '',
  companyAddress: '',
  siteManagerName: '',
  siteManagerPhone: '',
  supervisorName: '',
  supervisorPhone: '',
  firstAiderName: '',
  firstAiderPhone: '',
  emergencyAssemblyPoint: '',
  nearestHospital: '',
  riskMatrixDefinition: '',
  mandatoryControls: '',
  ptwTriggers: '',
  docRefFormat: '',
  additionalGuidance: '',
};

export function injectProfileIntoPrompt(profile) {
  const lines = [];
  if (profile.companyName)
    lines.push(`CONTRACTOR: ${profile.companyName}${profile.companyAddress ? `, ${profile.companyAddress}` : ''}`);
  if (profile.siteManagerName)
    lines.push(`SITE MANAGER: ${profile.siteManagerName}${profile.siteManagerPhone ? ` — Tel: ${profile.siteManagerPhone}` : ''}`);
  if (profile.supervisorName)
    lines.push(`SUPERVISOR: ${profile.supervisorName}${profile.supervisorPhone ? ` — Tel: ${profile.supervisorPhone}` : ''}`);
  if (profile.firstAiderName)
    lines.push(`FIRST AIDER: ${profile.firstAiderName}${profile.firstAiderPhone ? ` — Tel: ${profile.firstAiderPhone}` : ''}`);
  if (profile.emergencyAssemblyPoint)
    lines.push(`EMERGENCY ASSEMBLY POINT: ${profile.emergencyAssemblyPoint}`);
  if (profile.nearestHospital)
    lines.push(`NEAREST A&E HOSPITAL: ${profile.nearestHospital}`);
  if (profile.riskMatrixDefinition)
    lines.push(`COMPANY RISK MATRIX (use this, not the default 5×5):\n${profile.riskMatrixDefinition}`);
  if (profile.mandatoryControls)
    lines.push(`MANDATORY CONTROLS (must appear in every RAMS regardless of task):\n${profile.mandatoryControls}`);
  if (profile.ptwTriggers)
    lines.push(`PERMIT TO WORK TRIGGERS:\n${profile.ptwTriggers}`);
  if (profile.docRefFormat)
    lines.push(`DOCUMENT REFERENCE FORMAT: ${profile.docRefFormat}`);
  if (profile.additionalGuidance)
    lines.push(`ADDITIONAL MANAGEMENT SYSTEM GUIDANCE:\n${profile.additionalGuidance}`);

  if (lines.length === 0) return '';
  return '\n\nCOMPANY MANAGEMENT SYSTEM — incorporate all of the following into the document:\n' + lines.join('\n');
}

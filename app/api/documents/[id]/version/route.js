import { NextResponse } from 'next/server';
import { addAuditLog, authError, requireUser } from '../../../_utils';

function diffDocuments(previousData = {}, nextData = {}) {
  const fields = new Set([...Object.keys(previousData), ...Object.keys(nextData)]);
  const rows = [];
  fields.forEach(field => {
    if (field === 'hazards' && Array.isArray(previousData.hazards) && Array.isArray(nextData.hazards)) {
      const oldByName = new Map(previousData.hazards.map(item => [item.hazard, item]));
      const newByName = new Map(nextData.hazards.map(item => [item.hazard, item]));
      new Set([...oldByName.keys(), ...newByName.keys()]).forEach(name => {
        const oldValue = JSON.stringify(oldByName.get(name) || null);
        const newValue = JSON.stringify(newByName.get(name) || null);
        if (oldValue !== newValue) rows.push({ field: `hazards:${name}`, old_value: oldValue, new_value: newValue });
      });
      return;
    }
    const oldValue = JSON.stringify(previousData[field] ?? null);
    const newValue = JSON.stringify(nextData[field] ?? null);
    if (oldValue !== newValue) rows.push({ field, old_value: oldValue, new_value: newValue });
  });
  return rows;
}

export async function POST(request, { params }) {
  try {
    const { supabase, user } = await requireUser(request);
    const { data: parent, error } = await supabase.from('rams_documents').select('*').eq('id', params.id).single();
    if (error || !parent) return NextResponse.json({ error: { message: 'Document not found.' } }, { status: 404 });
    const nextData = { ...(parent.data || {}), status: 'draft' };
    const { data: child, error: insertError } = await supabase.from('rams_documents').insert({
      user_id: user.id,
      org_id: parent.org_id,
      data: nextData,
      task_type: parent.task_type,
      location: parent.location,
      ref_number: parent.ref_number,
      status: 'draft',
      version: (parent.version || 1) + 1,
      parent_id: parent.id,
    }).select('*').single();
    if (insertError) throw insertError;
    const diffs = diffDocuments(parent.data, child.data).map(row => ({
      ...row,
      document_id: child.id,
      previous_id: parent.id,
      changed_by: user.id,
    }));
    if (diffs.length) await supabase.from('document_diffs').insert(diffs);
    await addAuditLog(supabase, { documentId: child.id, userId: user.id, action: 'version_created', detail: { previousId: parent.id } });
    return NextResponse.json({ document: child });
  } catch (err) {
    return err.message?.includes('Authentication') ? authError(err.message) : NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}

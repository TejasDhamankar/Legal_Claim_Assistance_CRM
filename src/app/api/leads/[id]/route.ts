import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Define as Promise
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // FIX: Await params before accessing .id
    const { id: leadId } = await params;

    const lead = await Lead.findById(leadId)
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

    if (decoded.role !== 'super_admin' &&
        lead.createdBy && lead.createdBy._id.toString() !== decoded.id) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Define as Promise
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // FIX: Await params before accessing .id
    const { id: leadId } = await params;
    const body = await request.json();

    if (decoded.role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

    const applicationType = body.applicationType || lead.applicationType;
    const incomingFields = body.fields && typeof body.fields === 'object'
      ? body.fields
      : Array.isArray(lead.fields)
        ? lead.fields.reduce((acc: Record<string, string>, field: { key: string; value: string }) => {
            if (field?.key) acc[field.key] = field.value || '';
            return acc;
          }, {})
        : {};

    const dynamicFieldsConfig = DYNAMIC_FIELDS[applicationType] || [];
    const isJuvenileAbuse = applicationType === 'Juvenile Detention Center (JDC)';
    const requiredFields = isJuvenileAbuse
      ? dynamicFieldsConfig.filter(f => f.key === 'Location Of Incident')
      : dynamicFieldsConfig.filter(f => f.required);
    const missingFields = requiredFields.filter(field => !incomingFields[field.key]?.toString().trim());

    if (missingFields.length > 0) {
      return NextResponse.json({
        message: `Missing required fields: ${missingFields.map(field => field.label).join(', ')}`,
      }, { status: 400 });
    }

    // Handle status history and dynamic fields as before
    if (body.status && body.status !== lead.status) {
      lead.statusHistory.push({
        fromStatus: lead.status,
        toStatus: body.status,
        notes: body.statusNote || "",
        changedBy: decoded.id,
        timestamp: new Date()
      });
      lead.status = body.status;
    }

    // Dynamic fields transformation
    if (body.fields && typeof body.fields === 'object') {
      lead.fields = Object.entries(body.fields)
        .filter(([_, v]) => v)
        .map(([k, v]) => ({ key: k, value: v }));
    }

    // Update basic fields
    const updateable = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'address', 'applicationType', 'lawsuit', 'notes'];
    updateable.forEach(field => { if (body[field]) lead[field] = body[field]; });

    await lead.save();
    return NextResponse.json({ message: 'Updated successfully', lead });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

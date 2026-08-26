import { NextRequest, NextResponse } from 'next/server';
import Lead from '@/models/Lead';
import { verifyToken, getAuthToken } from '@/lib/auth';
import { dbConnect } from '@/lib/dbConnect';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';
import User from '@/models/User';

const normalizeEmail = (value?: string | null) => {
  if (!value) return '';
  return value.trim().toLowerCase();
};

const normalizePhone = (value?: string | null) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

const normalizeText = (value?: string | null) => {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getFieldValue = (fields: unknown, key: string) => {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return '';
  const value = (fields as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
};

const buildDuplicateScope = (decoded: any, user: any) => {
  if (decoded.role === 'super_admin') return {};
  if (user?.organizationId) return { organizationId: user.organizationId };
  return { createdBy: decoded.id };
};

const buildLeadInfo = (lead: any) => ({
  id: lead._id,
  name: `${lead.firstName} ${lead.lastName}`,
  status: lead.status,
  organizationId: lead.organizationId || null,
  createdBy: lead.createdBy ? lead.createdBy.name : 'Unknown',
  createdAt: lead.createdAt
});

/** Global email match — duplicates across orgs still get DUPLICATE status */
const findLeadByEmail = async (normalizedEmail: string) => {
  if (!normalizedEmail) return null;
  return Lead.findOne({
    $or: [
      { emailNormalized: normalizedEmail },
      { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } },
    ],
  }).populate('createdBy', 'name email');
};

/** Global phone match */
const findLeadByPhone = async (normalizedPhone: string) => {
  if (!normalizedPhone) return null;
  return Lead.findOne({
    $or: [
      { phoneNormalized: normalizedPhone },
      {
        phone: {
          $regex: new RegExp(`^\\D*${normalizedPhone.split('').join('\\D*')}\\D*$`),
        },
      },
    ],
  }).populate('createdBy', 'name email');
};

const sameOrganization = (lead: any, user: any) => {
  if (!lead?.organizationId || !user?.organizationId) return false;
  return String(lead.organizationId) === String(user.organizationId);
};

const parseDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Already returns decoded token payload
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    const userRole = decoded.role;
    if (!userId) {
      return NextResponse.json({ error: 'Token missing user ID' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const entryDate = url.searchParams.get('entryDate');

    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    if (userRole !== 'super_admin') {
      query.createdBy = userId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { lawsuit: { $regex: search, $options: 'i' } },
      ];
    }
    if (entryDate) {
      const parsed = parseDateOnly(entryDate);
      if (parsed) {
        const start = new Date(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0);
        const end = new Date(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    const total = await Lead.countDocuments(query);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the user's organization to assign it to the lead
    const user = await User.findById(decoded.id).select('organizationId');

    const body = await request.json();
    const normalizedEmail = normalizeEmail(body.email);
    const normalizedPhone = normalizePhone(body.phone);
    const normalizedFirstName = normalizeText(body.firstName);
    const normalizedLastName = normalizeText(body.lastName);
    const normalizedAddress = normalizeText(body.address);

    // Server-side validation for required fields
    const { applicationType, fields, ...rest } = body;
    if (!applicationType) {
      return NextResponse.json({ message: 'Application type is required' }, { status: 400 });
    }

    const dynamicFieldsConfig = DYNAMIC_FIELDS[applicationType] || [];
    const isJuvenileAbuse = applicationType === 'Juvenile Detention Center (JDC)';
    const requiredFields = isJuvenileAbuse
      ? dynamicFieldsConfig.filter(f => f.key === 'Location Of Incident')
      : dynamicFieldsConfig.filter(f => f.required);
    const missingFields = [];

    for (const field of requiredFields) {
      if (!fields?.[field.key]?.toString().trim()) {
        missingFields.push(field.label);
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
      }, { status: 400 });
    }

    // Check for duplicate email or phone (global — so status becomes DUPLICATE)
    let isDuplicate = false;
    let duplicateReason = '';
    let existingLeadInfo = null;
    let existingLeadDoc: any = null;

    if (normalizedEmail) {
      const duplicateEmail = await findLeadByEmail(normalizedEmail);
      if (duplicateEmail) {
        isDuplicate = true;
        duplicateReason = 'email';
        existingLeadDoc = duplicateEmail;
        existingLeadInfo = buildLeadInfo(duplicateEmail);
      }
    }

    if (!isDuplicate && normalizedPhone) {
      const duplicatePhone = await findLeadByPhone(normalizedPhone);
      if (duplicatePhone) {
        isDuplicate = true;
        duplicateReason = 'phone number';
        existingLeadDoc = duplicatePhone;
        existingLeadInfo = buildLeadInfo(duplicatePhone);
      }
    }

    // Org-scoped checks for case-specific / name+address duplicates
    let duplicateQuery: any = buildDuplicateScope(decoded, user);

    if (!isDuplicate && applicationType === 'Rideshare') {
      const incidentPersonName = normalizeText(getFieldValue(fields, 'Incident Reported Person Name'));
      const incidentPersonNumber = normalizePhone(getFieldValue(fields, 'Incident Reported Person Number'));

      if (incidentPersonNumber) {
        const rideshareLeads = await Lead.find({
          ...duplicateQuery,
          applicationType: 'Rideshare',
          fields: {
            $all: [
              { $elemMatch: { key: 'Incident Reported Person Number' } }
            ]
          }
        }).populate('createdBy', 'name email');

        const duplicateIncidentPerson = rideshareLeads.find((lead: any) => {
          const existingFields = Array.isArray(lead.fields) ? lead.fields : [];
          const existingName = normalizeText(
            existingFields.find((field: any) => field.key === 'Incident Reported Person Name')?.value
          );
          const existingNumber = normalizePhone(
            existingFields.find((field: any) => field.key === 'Incident Reported Person Number')?.value
          );

          return existingNumber === incidentPersonNumber &&
            (!incidentPersonName || !existingName || existingName === incidentPersonName);
        });

        if (duplicateIncidentPerson) {
          isDuplicate = true;
          duplicateReason = 'rideshare incident reported person details';
          existingLeadDoc = duplicateIncidentPerson;
          existingLeadInfo = buildLeadInfo(duplicateIncidentPerson);
        }
      }
    }

    duplicateQuery = buildDuplicateScope(decoded, user);

    if (!isDuplicate && normalizedFirstName && normalizedLastName && normalizedAddress) {
      const duplicateNameAddress = await Lead.findOne({
        ...duplicateQuery,
        firstName: { $regex: new RegExp(`^${escapeRegex(normalizedFirstName)}$`, 'i') },
        lastName: { $regex: new RegExp(`^${escapeRegex(normalizedLastName)}$`, 'i') },
        address: { $regex: new RegExp(`^${escapeRegex(normalizedAddress)}$`, 'i') },
      }).populate('createdBy', 'name email');

      if (duplicateNameAddress) {
        isDuplicate = true;
        duplicateReason = 'name + address';
        existingLeadDoc = duplicateNameAddress;
        existingLeadInfo = buildLeadInfo(duplicateNameAddress);
      }
    }

    // Set status to DUPLICATE if a duplicate was found
    const status = isDuplicate ? 'DUPLICATE' : (body.status || 'PENDING');

    // Create notes with duplicate information if applicable
    let notes = body.notes || '';
    if (isDuplicate && existingLeadInfo) {
      notes = `${notes}\n\n[SYSTEM] This lead has been marked as a duplicate because the ${duplicateReason} matches an existing lead (${existingLeadInfo.name}).`;
    }

    // Transform dynamic fields from object to array format
    const fieldsArray = [];
    if (body.fields && typeof body.fields === 'object' && !Array.isArray(body.fields)) {
      for (const [key, value] of Object.entries(body.fields)) {
        if (value) {
          fieldsArray.push({ key, value });
        }
      }
    }

    // Avoid unique index collisions within the same org when marking duplicates
    const collideInOrg = isDuplicate && sameOrganization(existingLeadDoc, user);
    const leadPayload = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      emailNormalized: collideInOrg ? undefined : (normalizedEmail || undefined),
      phone: body.phone,
      phoneNormalized: collideInOrg ? undefined : (normalizedPhone || undefined),
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      applicationType: body.applicationType,
      lawsuit: (typeof body.lawsuit === 'string' && body.lawsuit.trim())
        ? body.lawsuit.trim()
        : (body.applicationType || ''),
      notes: notes,
      status: status,
      fields: fieldsArray,
      createdBy: decoded.id,
      organizationId: user?.organizationId || null,
      statusHistory: [
        {
          fromStatus: '',
          toStatus: status,
          notes: isDuplicate
            ? `Lead created and automatically marked as DUPLICATE (matching ${duplicateReason})`
            : 'Lead created',
          changedBy: decoded.id,
          timestamp: new Date()
        }
      ]
    };

    let lead;
    try {
      lead = await Lead.create(leadPayload);
    } catch (createError: any) {
      // Race / missed detection: unique index hit → still save as DUPLICATE
      if (createError?.code === 11000) {
        isDuplicate = true;
        if (!duplicateReason) duplicateReason = 'email or phone';
        notes = `${body.notes || ''}\n\n[SYSTEM] This lead has been marked as a duplicate because the ${duplicateReason} matches an existing lead.`;
        lead = await Lead.create({
          ...leadPayload,
          emailNormalized: undefined,
          phoneNormalized: undefined,
          status: 'DUPLICATE',
          notes,
          statusHistory: [
            {
              fromStatus: '',
              toStatus: 'DUPLICATE',
              notes: `Lead created and automatically marked as DUPLICATE (matching ${duplicateReason})`,
              changedBy: decoded.id,
              timestamp: new Date()
            }
          ]
        });
      } else {
        throw createError;
      }
    }

    return NextResponse.json({
      message: isDuplicate
        ? `Lead created but marked as DUPLICATE (matching ${duplicateReason})`
        : 'Lead created successfully',
      lead,
      isDuplicate,
      duplicateInfo: isDuplicate ? existingLeadInfo : null
    }, { status: 201 });
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError?.code === 11000) {
      return NextResponse.json(
        { message: 'Duplicate lead detected while saving. Please refresh and review the existing record.' },
        { status: 409 }
      );
    }
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

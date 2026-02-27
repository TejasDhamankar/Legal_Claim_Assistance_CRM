/** lib/dynamic-fields.ts
 * Every mass-tort “application type” maps to its own list
 * of { key, label, type } objects that the UI renders
 * dynamically when that case is chosen.
 */
export const DYNAMIC_FIELDS: Record<
  string,
  Array<{
    key: string;
    label: string;
    type: 'text' | 'date' | 'radio' | 'checkbox' | 'textarea' | 'email' | 'phone';
    options?: { label: string; value: string }[];
    required?: boolean;
  }>
> = {
  /* ───────────────────────── HAIR RELAXER ──────────────────────── */
  'Hair Relaxer': [
    { key: 'Attorney', label: 'Are You Currently Represented By An  Attorney?', type: 'radio' },
    { key: 'Brand Used', label: 'Brand Of Hair Relaxer Used', type: 'text' },
    { key: 'Start Date', label: 'Hair Relaxer Used Start Date', type: 'date' },
    { key: 'Stop Date', label: 'Hair Relaxer Used Stop Date', type: 'date' },
    { key: 'Usage Frequency', label: 'How Often Used (≥ 3×/yr For > 1 yr)', type: 'text' },
    { key: 'Injury Type', label: 'Type Of Injury', type: 'text' },
    { key: 'Diagnosis Date', label: 'Diagnosis Date', type: 'date' },
    { key: 'Healthcare Facility', label: 'Healthcare Provider / Facility', type: 'text' },
    { key: 'Breast Cancer Or Lynch', label: 'Diagnosed With Breast Cancer / Lynch ?', type: 'radio' }
  ],

  /* ───────────────────────── DEPO PROVERA ──────────────────────── */
  'Depo Provera': [
    { key: 'Year Used', label: 'Year Brand Drug First Used', type: 'text' },
    { key: 'Usage Duration', label: 'Total Years Depo-Provera Used', type: 'text' },
    { key: 'Shot Frequency', label: 'How Often Did You Take A Shot?', type: 'text' },
    { key: 'Illness', label: 'Illness Diagnosed With', type: 'text' },
    { key: 'Symptoms', label: 'Symptoms', type: 'text' },
    { key: 'Diagnosing Doctor', label: 'Doctor Who Diagnosed You', type: 'text' }
  ],

  /* ───────────────────────── RIDESHARE ────────────────────────── */
  'Rideshare': [
    { key: 'Name', label: 'Name', type: 'text', required: true },
    { key: 'Email', label: 'Email', type: 'email', required: true },
    { key: 'Phone', label: 'Phone', type: 'phone', required: true },
    { key: 'Dob', label: 'Date Of Birth', type: 'date', required: true },
    { key: 'Address', label: 'Address', type: 'text', required: true },
    { key: 'Incident Date', label: 'Date Of Incident', type: 'date', required: true },
    { key: 'Type Of Assault', label: 'Type Of Assault', type: 'radio', required: true, options: [
        { label: 'Exposure Of Genitals', value: 'Exposure of genitals' },
        { label: 'Fondling', value: 'Fondling' },
        { label: 'Inappropriate Touching', value: 'Inappropriate Touching' },
        { label: 'Kissing', value: 'Kissing' },
        { label: 'Masturbation', value: 'Masturbation' },
        { label: 'Oral Sex', value: 'Oral Sex' },
        { label: 'Penetration', value: 'Penetration' },
        { label: 'Sexual Intercourse', value: 'Sexual Intercourse' }
      ] 
    },
    { key: 'Proof Of Ride', label: 'Proof Of Ride?', type: 'radio', required: true, options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
      ]
    },
    { key: 'Attorney', label: 'Are You Currently Represented By An  Attorney?', type: 'radio', required: true, options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
      ]
    }
  ],

  /* ───────────────────────── ROUNDUP ───────────────────────────── */
  'Roundup': [
    { key: 'Roundup Type', label: 'Type Of Roundup Used (Concentrate / Pre-Mix)', type: 'text' },
    { key: 'Use Duration', label: 'Total Years Roundup Used (› 1 yr)', type: 'text' },
    { key: 'Use Start', label: 'Use Started (MM/YYYY)', type: 'text' },
    { key: 'Nhl Diagnosed', label: 'Diagnosed With Non-Hodgkin’s Lymphoma?', type: 'radio' },
    { key: 'Nhl Diagnosis Date', label: 'Date Of NHL Diagnosis', type: 'date' },
    { key: 'Treated For NHL', label: 'Received Treatment For NHL?', type: 'radio' },
    { key: 'Treatment Type', label: 'Treatment Received (Chemo / Radiation / Both)', type: 'text' },
    { key: 'Hospital Name', label: 'Hospital Name', type: 'text' },
    { key: 'Hospital Address', label: 'Hospital Address', type: 'text' },
    { key: 'Doctor Name', label: 'Doctor Name', type: 'text' },
    { key: 'Doctor Designation', label: 'Doctor Designation', type: 'text' }
  ],

  /* ───────────────────────── NEC ───────────────────────────────── */
  'NEC': [
    { key: 'Qualifying Injury', label: 'Qualifying Injury', type: 'text' },
    { key: 'Child Name', label: 'Child Name', type: 'text' },
    { key: 'Child DOB', label: 'Child DOB', type: 'date' },
    { key: 'Diagnose Date', label: 'NEC Diagnose Date', type: 'date' },
    { key: 'Weeks At Birth', label: 'Weeks Of Pregnancy When Gave Birth', type: 'text' },
    { key: 'Cow Milk Formula', label: 'Infant Given Cow-Milk Formula/Fortifier?', type: 'radio' },
    { key: 'Attorney', label: 'Are You Currently Represented By An  Attorney?', type: 'radio' }
  ],

  /* ───────────────────────── ROBLOX ────────────────────────────── */
  'Roblox': [
    { key: 'Name', label: 'Name', type: 'text', required: true },
    { key: 'Email', label: 'Email', type: 'email', required: true },
    { key: 'Phone', label: 'Phone', type: 'phone', required: true },
    { key: 'Dob', label: 'Date Of Birth', type: 'date', required: true },
    { key: 'Address', label: 'Address', type: 'text', required: true },
    { key: 'Incident Date', label: 'Date Of Incident', type: 'date', required: true },
    { key: 'Roblox Id And User', label: 'Roblox ID And User Name', type: 'text', required: true },
    { key: 'Abuser Roblox Id', label: 'Abuser’s Roblox ID', type: 'text', required: true },
    { key: 'Type Of Issue', label: 'Type Of Issue', type: 'text', required: true },
    { key: 'Other Apps Involved', label: 'Were There Any Other Apps Involved In The Abuse?', type: 'text', required: true },
    { key: 'Other App Id', label: 'ID Of Other App (If Any)', type: 'text', required: false },
    { key: 'Attorney', label: 'Are You Currently Represented By An  Attorney?', type: 'radio', required: true, options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
      ]
    }
  ],

  /* ───────────────────────── ILLINOIS ABUSE ────────────────────── */
  'Illinois Abuse': [
    { key: 'Name', label: 'Name', type: 'text', required: true },
    { key: 'Email', label: 'Email', type: 'email', required: true },
    { key: 'Phone', label: 'Phone', type: 'phone', required: true },
    { key: 'Dob', label: 'Date Of Birth', type: 'date', required: true },
    { key: 'Address', label: 'Address', type: 'text', required: true },
    { key: 'Incident Date', label: 'Date Of Incident', type: 'date', required: true },
    { key: 'Type Of Abuse', label: 'Type Of Abuse', type: 'text', required: true },
    { key: 'Location Of Incident', label: 'Location / Facility Name', type: 'text', required: true },
    { key: 'Other Details', label: 'Additional Incident Details', type: 'textarea' },
    { key: 'Attorney', label: 'Are You Currently Represented By An  Attorney?', type: 'radio', required: true, options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' }
      ]
    }
  ],

  /* ───────────────────────── PARAQUAT ──────────────────────────── */
  'Paraquat': [
    { key: 'Exposure Date', label: 'Date Of Exposure To Paraquat', type: 'date' },
    { key: 'Company Name', label: 'Company You Worked For', type: 'text' },
    { key: 'Exposures Per Year', label: 'Times Per Year Exposed (≥ 8 Lifetime)', type: 'text' },
    { key: 'Genetic Testing', label: 'Had Genetic Testing For Parkinson’s?', type: 'radio' },
    { key: 'Parkinson Dx Date', label: 'Parkinson’s Date Of Diagnosis', type: 'date' },
    { key: 'Symptoms', label: 'Symptoms Of Illness', type: 'text' },
    { key: 'Doctor Name', label: 'Diagnosing Doctor Name', type: 'text' },
    { key: 'Hospital', label: 'Hospital Name And Address', type: 'text' }
  ],

  /* ───────────────────────── TALCUM ────────────────────────────── */
  'Talcum': [
    { key: 'Usage Years', label: 'Start – End Year Of Talcum Usage', type: 'text' },
    { key: 'Diagnosis', label: 'Diagnosis', type: 'text' },
    { key: 'Year Dx', label: 'Year Of Dx', type: 'text' },
    { key: 'Treatment', label: 'Treatment', type: 'text' },
    { key: 'Attorney', label: 'Are You Currently Represented By An  Attorney?', type: 'radio' },
    { key: 'Hospital Name', label: 'Hospital Name', type: 'text' }
  ],

  /* ───────────────────────── AFFF ──────────────────────────────── */
  'AFFF': [
    { key: 'Phone Number', label: 'Phone Number', type: 'text' },
    { key: 'First Name', label: 'First Name', type: 'text' },
    { key: 'Last Name', label: 'Last Name', type: 'text' },
    { key: 'Exposed To AFFF', label: 'Were You Or A Loved One Exposed To AFFF', type: 'radio' },
    { key: 'When Exposed', label: 'When Were You Or A Loved One Exposed To AFFF?', type: 'text' },
    { key: 'Exposure Frequency', label: 'How Many Times Were You Exposed To AFFF Over The Last 10 Years?', type: 'radio' },
    { key: 'First Exposure Date', label: 'When Were You First Exposed To AFFF?', type: 'date' },
    { key: 'Was Firefighter', label: 'Was The Injured Party A Fire Fighter?', type: 'radio' },
    { key: 'Firefighter Duration', label: 'How Long Was The Injured Part A Fire Fighter?', type: 'text' },
    { key: 'Fire Station', label: 'What Station (City State And Name) Did They Work At?', type: 'text' },
    { key: 'Fire Station Years', label: 'What Years Did They Work At The Fire Station?', type: 'text' },
    { key: 'Last Exposure Date', label: 'When Were You Last Exposed To AFFF?', type: 'date' },
    { key: 'Calling On Behalf Of', label: 'Are You Calling On Behalf Of Yourself, Or Someone Else?', type: 'radio' },
    { key: 'Claimant Name', label: 'Claimant Name', type: 'text' },
    { key: 'Claimant Gender', label: 'Claimant Gender', type: 'radio' },
    { key: 'Relationship', label: 'What Is The Relationship To The Party You Are Calling On Behalf Of?', type: 'radio' },
    { key: 'Is Deceased', label: 'Is The Affected Person Deceased?', type: 'radio' },
    { key: 'Date Of Death', label: 'Date Of Death', type: 'text' },
    { key: 'Disease Type', label: 'Category A What Type Of Disease Did The Injured Party Suffer From?', type: 'radio' },
    { key: 'Diagnosis Date', label: 'Diagnosis Date', type: 'date' },
    { key: 'Has Legal Representation', label: 'Do You Have Legal Representation?', type: 'radio' },
    { key: 'Preferred Contact Method', label: 'What Is Your Preferred Method Of Contact?', type: 'radio' },
    { key: 'Date Of Birth', label: 'Date Of Birth', type: 'date' },
    { key: 'Email', label: 'Email', type: 'text' },
    { key: 'Street Address', label: 'Street Address', type: 'text' },
    { key: 'City', label: 'City', type: 'text' },
    { key: 'State', label: 'State', type: 'text' },
    { key: 'Zip Code', label: 'Zip Code', type: 'text' }
  ]
};

DYNAMIC_FIELDS['Juvenile Detention Center (JDC)'] = DYNAMIC_FIELDS['Illinois Abuse'];

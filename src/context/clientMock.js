// Mock client data for healthcare management system
export const mockClients = [
  {
    id: 1,
    firstName: 'Victoria',
    lastName: 'Cantrel',
    age: 16,
    dateOfBirth: '2008-03-15',
    phone: '+1-555-0101',
    email: 'victoria.cantrel@email.com',
    facility: 'facility-a',
    room: 'A-101',
    admissionDate: '2024-01-10',
    status: 'Stable',
    profilePhoto: null, // Will use placeholder
    dietaryRestrictions: ['Gluten-free', 'No nuts'],
    activityPreferences: ['Reading', 'Art', 'Sports'],
    otherPreferences: ['Private room preferred', 'Evening study time'],
    medicalNotes: 'Regular check-ups required. Participates in therapy sessions.',
    emergencyContact: {
      name: 'John Cantrel',
      relationship: 'Guardian',
      phone: '+1-555-0102',
      email: 'john.cantrel@email.com'
    },
    secondaryEmergencyContact: {
      name: 'Mary Cantrel',
      relationship: 'Aunt',
      phone: '+1-555-0103',
      email: 'mary.cantrel@email.com'
    },
    assignedStaff: ['Sarah Johnson', 'Mike Chen'],
    lastUpdated: '2024-01-20T10:30:00Z'
  },
  {
    id: 2,
    firstName: 'Robert',
    lastName: 'Martinez',
    age: 17,
    dateOfBirth: '2007-07-22',
    phone: '+1-555-0103',
    email: 'robert.martinez@email.com',
    facility: 'facility-a',
    room: 'A-102',
    admissionDate: '2024-01-12',
    status: 'Improving',
    profilePhoto: null,
    dietaryRestrictions: ['Diabetic diet'],
    activityPreferences: ['Walking', 'Card games', 'Music therapy'],
    otherPreferences: ['Shared room acceptable', 'Evening medication'],
    medicalNotes: 'Type 2 diabetes. Blood sugar monitoring twice daily. Responding well to treatment.',
    emergencyContact: {
      name: 'Maria Martinez',
      relationship: 'Daughter',
      phone: '+1-555-0104',
      email: 'maria.martinez@email.com'
    },
    secondaryEmergencyContact: {
      name: 'Carlos Martinez',
      relationship: 'Son',
      phone: '+1-555-0105',
      email: 'carlos.martinez@email.com'
    },
    assignedStaff: ['Sarah Johnson'],
    lastUpdated: '2024-01-19T14:15:00Z'
  },
  {
    id: 3,
    firstName: 'Jennifer',
    lastName: 'Lee',
    age: 15,
    dateOfBirth: '2009-11-08',
    phone: '+1-555-0105',
    email: 'jennifer.lee@email.com',
    facility: 'facility-a',
    room: 'A-103',
    admissionDate: '2024-01-15',
    status: 'Stable',
    profilePhoto: null,
    dietaryRestrictions: ['Vegetarian', 'No nuts'],
    activityPreferences: ['Yoga', 'Art therapy', 'Reading'],
    otherPreferences: ['Quiet environment', 'Natural lighting'],
    medicalNotes: 'Post-surgical recovery. Physical therapy sessions scheduled.',
    emergencyContact: {
      name: 'David Lee',
      relationship: 'Brother',
      phone: '+1-555-0106',
      email: 'david.lee@email.com'
    },
    assignedStaff: ['Mike Chen'],
    lastUpdated: '2024-01-18T09:45:00Z'
  },
  {
    id: 4,
    firstName: 'Michael',
    lastName: 'Brown',
    age: 61,
    dateOfBirth: '1963-05-14',
    phone: '+1-555-0107',
    email: 'michael.brown@email.com',
    facility: 'facility-a',
    room: 'A-104',
    admissionDate: '2024-01-08',
    status: 'Critical',
    profilePhoto: null,
    dietaryRestrictions: ['Pureed diet', 'Thickened liquids'],
    activityPreferences: ['Gentle movement', 'Music therapy'],
    otherPreferences: ['24/7 monitoring', 'Family visits limited'],
    medicalNotes: 'Stroke recovery. Requires intensive therapy and close monitoring.',
    emergencyContact: {
      name: 'Linda Brown',
      relationship: 'Wife',
      phone: '+1-555-0108',
      email: 'linda.brown@email.com'
    },
    assignedStaff: ['Sarah Johnson', 'Mike Chen'],
    lastUpdated: '2024-01-20T16:20:00Z'
  },
  {
    id: 5,
    firstName: 'Sarah',
    lastName: 'Wilson',
    age: 29,
    dateOfBirth: '1995-09-30',
    phone: '+1-555-0109',
    email: 'sarah.wilson@email.com',
    facility: 'facility-a',
    room: 'A-105',
    admissionDate: '2024-01-14',
    status: 'Stable',
    profilePhoto: null,
    dietaryRestrictions: ['Lactose intolerant'],
    activityPreferences: ['Swimming', 'Group activities', 'Crafts'],
    otherPreferences: ['Social interaction important', 'Outdoor time'],
    medicalNotes: 'Mental health support. Regular counseling sessions.',
    emergencyContact: {
      name: 'Tom Wilson',
      relationship: 'Father',
      phone: '+1-555-0110',
      email: 'tom.wilson@email.com'
    },
    assignedStaff: ['Sarah Johnson'],
    lastUpdated: '2024-01-19T11:30:00Z'
  },
  {
    id: 6,
    firstName: 'David',
    lastName: 'Johnson',
    age: 47,
    dateOfBirth: '1977-12-03',
    phone: '+1-555-0111',
    email: 'david.johnson@email.com',
    facility: 'facility-b',
    room: 'B-201',
    admissionDate: '2024-01-11',
    status: 'Recovering',
    profilePhoto: null,
    dietaryRestrictions: ['Low cholesterol'],
    activityPreferences: ['Physical therapy', 'Walking', 'Reading'],
    otherPreferences: ['Shared room', 'Regular exercise'],
    medicalNotes: 'Cardiac rehabilitation. Gradual increase in activity level.',
    emergencyContact: {
      name: 'Lisa Johnson',
      relationship: 'Wife',
      phone: '+1-555-0112',
      email: 'lisa.johnson@email.com'
    },
    assignedStaff: ['Mike Chen'],
    lastUpdated: '2024-01-20T08:15:00Z'
  },
  {
    id: 7,
    firstName: 'Lisa',
    lastName: 'Anderson',
    age: 34,
    dateOfBirth: '1990-04-18',
    phone: '+1-555-0113',
    email: 'lisa.anderson@email.com',
    facility: 'facility-b',
    room: 'B-202',
    admissionDate: '2024-01-13',
    status: 'Stable',
    profilePhoto: null,
    dietaryRestrictions: ['Kosher'],
    activityPreferences: ['Art therapy', 'Music', 'Group discussions'],
    otherPreferences: ['Private room', 'Religious services'],
    medicalNotes: 'Anxiety management. Responding well to treatment plan.',
    emergencyContact: {
      name: 'Mark Anderson',
      relationship: 'Husband',
      phone: '+1-555-0114',
      email: 'mark.anderson@email.com'
    },
    assignedStaff: ['Sarah Johnson'],
    lastUpdated: '2024-01-18T13:45:00Z'
  },
  {
    id: 8,
    firstName: 'James',
    lastName: 'Taylor',
    age: 56,
    dateOfBirth: '1968-08-25',
    phone: '+1-555-0115',
    email: 'james.taylor@email.com',
    facility: 'facility-b',
    room: 'B-203',
    admissionDate: '2024-01-09',
    status: 'Improving',
    profilePhoto: null,
    dietaryRestrictions: ['Renal diet'],
    activityPreferences: ['Gentle exercise', 'Reading', 'TV'],
    otherPreferences: ['Quiet environment', 'Regular dialysis'],
    medicalNotes: 'Chronic kidney disease. Dialysis three times per week.',
    emergencyContact: {
      name: 'Susan Taylor',
      relationship: 'Sister',
      phone: '+1-555-0116',
      email: 'susan.taylor@email.com'
    },
    assignedStaff: ['Mike Chen'],
    lastUpdated: '2024-01-19T15:30:00Z'
  },
  {
    id: 9,
    firstName: 'Maria',
    lastName: 'Garcia',
    age: 41,
    dateOfBirth: '1983-01-12',
    phone: '+1-555-0117',
    email: 'maria.garcia@email.com',
    facility: 'facility-b',
    room: 'B-204',
    admissionDate: '2024-01-16',
    status: 'Stable',
    profilePhoto: null,
    dietaryRestrictions: ['Halal'],
    activityPreferences: ['Walking', 'Crafts', 'Social activities'],
    otherPreferences: ['Shared room acceptable', 'Family visits'],
    medicalNotes: 'Post-operative care. Healing well from procedure.',
    emergencyContact: {
      name: 'Carlos Garcia',
      relationship: 'Husband',
      phone: '+1-555-0118',
      email: 'carlos.garcia@email.com'
    },
    assignedStaff: ['Sarah Johnson'],
    lastUpdated: '2024-01-17T10:20:00Z'
  },
  {
    id: 10,
    firstName: 'John',
    lastName: 'Smith',
    age: 67,
    dateOfBirth: '1957-06-07',
    phone: '+1-555-0119',
    email: 'john.smith@email.com',
    facility: 'facility-c',
    room: 'C-301',
    admissionDate: '2024-01-07',
    status: 'Critical',
    profilePhoto: null,
    dietaryRestrictions: ['Tube feeding'],
    activityPreferences: ['Passive range of motion'],
    otherPreferences: ['24/7 monitoring', 'Family visits supervised'],
    medicalNotes: 'ICU patient. Multiple comorbidities. Requires constant monitoring.',
    emergencyContact: {
      name: 'Mary Smith',
      relationship: 'Wife',
      phone: '+1-555-0120',
      email: 'mary.smith@email.com'
    },
    assignedStaff: ['Sarah Johnson', 'Mike Chen'],
    lastUpdated: '2024-01-20T12:00:00Z'
  },
  {
    id: 11,
    firstName: 'Emily',
    lastName: 'Davis',
    age: 43,
    dateOfBirth: '1981-10-14',
    phone: '+1-555-0121',
    email: 'emily.davis@email.com',
    facility: 'facility-c',
    room: 'C-302',
    admissionDate: '2024-01-12',
    status: 'Stable',
    profilePhoto: null,
    dietaryRestrictions: ['Low sodium', 'No caffeine'],
    activityPreferences: ['Light exercise', 'Reading', 'Meditation'],
    otherPreferences: ['Private room', 'Quiet environment'],
    medicalNotes: 'Cardiac monitoring. Blood pressure well controlled.',
    emergencyContact: {
      name: 'Robert Davis',
      relationship: 'Husband',
      phone: '+1-555-0122',
      email: 'robert.davis@email.com'
    },
    assignedStaff: ['Mike Chen'],
    lastUpdated: '2024-01-19T14:45:00Z'
  },
  {
    id: 12,
    firstName: 'Christopher',
    lastName: 'Lee',
    age: 39,
    dateOfBirth: '1985-02-28',
    phone: '+1-555-0123',
    email: 'christopher.lee@email.com',
    facility: 'facility-c',
    room: 'C-303',
    admissionDate: '2024-01-14',
    status: 'Improving',
    profilePhoto: null,
    dietaryRestrictions: ['Diabetic diet'],
    activityPreferences: ['Physical therapy', 'Walking', 'Music'],
    otherPreferences: ['Shared room', 'Regular exercise'],
    medicalNotes: 'Diabetes management. Blood sugar levels stabilizing.',
    emergencyContact: {
      name: 'Jennifer Lee',
      relationship: 'Wife',
      phone: '+1-555-0124',
      email: 'jennifer.lee@email.com'
    },
    assignedStaff: ['Sarah Johnson'],
    lastUpdated: '2024-01-18T16:30:00Z'
  }
];

// Helper functions for client data
export const getClientsByFacility = (facilityId) => {
  return mockClients.filter(client => client.facility === facilityId);
};

export const getClientById = (clientId) => {
  return mockClients.find(client => client.id === parseInt(clientId));
};

export const getClientStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'stable':
    case 'recovering':
      return 'success';
    case 'improving':
      return 'primary';
    case 'critical':
      return 'error';
    default:
      return 'default';
  }
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

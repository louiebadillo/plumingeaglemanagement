const mock = {
  tasks: [
    {
      id: 0,
      type: "Patient Review",
      title: "Review Victoria Cantrel's progress",
      time: "9:00"
    },
    {
      id: 1,
      type: "Report",
      title: "Complete daily reports for Ward A",
      time: "12:00"
    },
    {
      id: 2,
      type: "Meeting",
      title: "Team meeting with Dr. Johnson",
      time: "14:00"
    },
    {
      id: 3,
      type: "Assessment",
      title: "Patient assessment - Michael Brown",
      time: "15:00"
    }
  ],
  bigStat: [
    {
      product: "Ward A",
      total: {
        monthly: 145,
        weekly: 36,
        daily: 5,
        percent: { value: 8.2, profit: true }
      },
      color: "primary",
      registrations: {
        monthly: { value: 12, profit: true },
        weekly: { value: 3, profit: true },
        daily: { value: 1, profit: true }
      },
      bounce: {
        monthly: { value: 2.1, profit: true },
        weekly: { value: 1.8, profit: true },
        daily: { value: 0.3, profit: true }
      }
    },
    {
      product: "Ward B",
      total: {
        monthly: 98,
        weekly: 24,
        daily: 3,
        percent: { value: 5.7, profit: true }
      },
      color: "warning",
      registrations: {
        monthly: { value: 8, profit: true },
        weekly: { value: 2, profit: true },
        daily: { value: 0, profit: false }
      },
      bounce: {
        monthly: { value: 3.2, profit: false },
        weekly: { value: 2.8, profit: false },
        daily: { value: 0.4, profit: false }
      }
    },
    {
      product: "Ward C",
      total: {
        monthly: 167,
        weekly: 42,
        daily: 6,
        percent: { value: 12.4, profit: true }
      },
      color: "secondary",
      registrations: {
        monthly: { value: 15, profit: true },
        weekly: { value: 4, profit: true },
        daily: { value: 1, profit: true }
      },
      bounce: {
        monthly: { value: 1.8, profit: true },
        weekly: { value: 1.5, profit: true },
        daily: { value: 0.2, profit: true }
      }
    }
  ],
  notifications: [
    {
      id: 0,
      icon: "thumbs-up",
      color: "primary",
      content:
        'Dr. Johnson <span className="fw-semi-bold">approved</span> your report'
    },
    {
      id: 1,
      icon: "file",
      color: "success",
      content: "Daily report completed for Ward A"
    },
    {
      id: 2,
      icon: "envelope",
      color: "danger",
      content: '2 <span className="fw-semi-bold">Critical</span> patient alerts'
    },
    {
      id: 3,
      icon: "comment",
      color: "success",
      content: '3 <span className="fw-semi-bold">Patient</span> reviews pending'
    },
    {
      id: 4,
      icon: "cog",
      color: "light",
      content: 'New <span className="fw-semi-bold">Assessment</span> form available'
    },
    {
      id: 5,
      icon: "bell",
      color: "info",
      content:
        '5 <span className="fw-semi-bold">Reminders</span> for patient checkups'
    }
  ],
  table: [
    {
      id: 0,
      name: "Victoria Cantrel",
      email: "v.cantrel@patient.com",
      product: "Daily Assessment",
      price: "4.2/5",
      date: "11 Jan 2024",
      city: "Ward A",
      status: "Completed",
      color: "success"
    },
    {
      id: 1,
      name: "Cherokee Ware",
      email: "c.ware@patient.com",
      product: "Progress Review",
      price: "4.8/5",
      date: "4 Jan 2024",
      city: "Ward B",
      status: "Completed",
      color: "success"
    },
    {
      id: 2,
      name: "Constance Clayton",
      email: "c.clayton@patient.com",
      product: "Health Check",
      price: "2.1/5",
      date: "27 Jan 2024",
      city: "Ward A",
      status: "Needs Review",
      color: "warning"
    },
    {
      id: 3,
      name: "Robert Martinez",
      email: "r.martinez@patient.com",
      product: "Medication Review",
      price: "3.5/5",
      date: "19 Jan 2024",
      city: "Ward C",
      status: "In Progress",
      color: "primary"
    },
    {
      id: 4,
      name: "Jennifer Lee",
      email: "j.lee@patient.com",
      product: "Therapy Session",
      price: "4.6/5",
      date: "1 Jan 2024",
      city: "Ward B",
      status: "Completed",
      color: "success"
    }
  ]
};

export default mock;
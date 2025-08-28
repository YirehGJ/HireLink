import type { User, Job, Candidate, Recommendation, Application, Organization } from './types';

export const users: User[] = [
  { id: 'user-1', email: 'candidate@example.com', fullName: 'Alex Doe', role: 'candidate', status: 'active' },
  { id: 'user-2', email: 'recruiter@example.com', fullName: 'Brenda Smith', role: 'recruiter', status: 'active', organizationRef: 'org-1' },
  { id: 'user-3', email: 'admin@example.com', fullName: 'Casey Jones', role: 'admin', status: 'active' },
  { id: 'user-4', email: 'candidate2@example.com', fullName: 'Devon Ray', role: 'candidate', status: 'active' },
];

export const organizations: Organization[] = [
    {
        id: 'org-1',
        name: 'Tech Innovators Inc.',
        description: 'Pioneering the future of technology with cutting-edge solutions and a passion for innovation. Join us to build tomorrow, today.',
        website: 'https://tech-innovators.example.com',
        logoUrl: 'https://picsum.photos/seed/tech-innovators/200/200'
    }
];

export const candidates: Candidate[] = [
  {
    id: 'candidate-1',
    userRef: 'user-1',
    headline: 'Senior Frontend Developer',
    location: 'Mexico City, MX',
    yearsOfExperience: 8,
    available: true,
    skills: [
      { name: 'React', level: 5, years: 8, source: 'resume' },
      { name: 'TypeScript', level: 5, years: 6, source: 'resume' },
      { name: 'Next.js', level: 4, years: 4, source: 'resume' },
      { name: 'GraphQL', level: 3, years: 3, source: 'resume' },
    ],
  },
  {
    id: 'candidate-2',
    userRef: 'user-4',
    headline: 'Backend Engineer',
    location: 'Guadalajara, MX',
    yearsOfExperience: 5,
    available: true,
    skills: [
        { name: 'Node.js', level: 5, years: 5, source: 'resume' },
        { name: 'PostgreSQL', level: 4, years: 4, source: 'resume' },
        { name: 'Docker', level: 4, years: 3, source: 'resume' },
        { name: 'AWS', level: 3, years: 3, source: 'resume' },
    ],
  }
];

export const jobs: Job[] = [
  {
    id: 'job-1',
    organizationRef: 'org-1',
    title: 'Lead Frontend Engineer',
    descriptionMd: 'Lead our frontend team to build next-gen UIs with React and Next.js. You will be responsible for the technical direction of the product and mentoring junior developers.',
    location: 'Remote (Mexico)',
    remoteAllowed: true,
    contractType: 'Full-time',
    seniority: 'lead',
    status: 'published',
    searchTags: ['react', 'nextjs', 'typescript', 'lead'],
  },
  {
    id: 'job-2',
    organizationRef: 'org-1',
    title: 'Senior Backend Developer (Node.js)',
    descriptionMd: 'Design and implement scalable backend services using Node.js, an ideal candidate has experience with microservices architecture and cloud-native technologies.',
    location: 'Mexico City, MX',
    remoteAllowed: false,
    contractType: 'Full-time',
    seniority: 'senior',
    status: 'published',
    searchTags: ['nodejs', 'postgres', 'docker', 'aws'],
  },
  {
    id: 'job-3',
    organizationRef: 'org-1',
    title: 'Mid-level Full-stack Developer',
    descriptionMd: 'Work across our stack, from React frontend to our Node.js backend. A great opportunity to grow and learn from a talented team of engineers.',
    location: 'Remote',
    remoteAllowed: true,
    contractType: 'Full-time',
    seniority: 'mid',
    status: 'draft',
    searchTags: ['react', 'nodejs', 'fullstack'],
  },
];

export const recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    candidateRef: 'candidate-1',
    jobRef: 'job-1',
    score: 0.92,
    reasons: ['Excellent match for React', 'Strong TypeScript experience', 'Next.js proficiency'],
    engineVersion: '1.0.0',
    createdAt: new Date(),
  },
  {
    id: 'rec-2',
    candidateRef: 'candidate-1',
    jobRef: 'job-3',
    score: 0.78,
    reasons: ['Strong React skills', 'Potential to grow into full-stack', 'Experience with related technologies'],
    engineVersion: '1.0.0',
    createdAt: new Date(),
  },
  {
    id: 'rec-3',
    candidateRef: 'candidate-2',
    jobRef: 'job-2',
    score: 0.88,
    reasons: ['Expert in Node.js', 'Solid database experience', 'Familiar with cloud infrastructure'],
    engineVersion: '1.0.0',
    createdAt: new Date(),
  },
];

export const applications: Application[] = [
    {
        id: 'app-1',
        candidateRef: 'candidate-1',
        jobRef: 'job-1',
        status: 'screening',
        source: 'recommendation',
        cvRef: 'cv.pdf',
        appliedAt: new Date(2024, 6, 10),
        updatedAt: new Date(2024, 6, 12),
    },
    {
        id: 'app-2',
        candidateRef: 'candidate-2',
        jobRef: 'job-1',
        status: 'applied',
        source: 'search',
        cvRef: 'cv2.pdf',
        appliedAt: new Date(2024, 6, 11),
        updatedAt: new Date(2024, 6, 11),
    }
];

export function getJob(id: string) {
    return jobs.find(job => job.id === id);
}

export function getCandidate(id: string) {
    return candidates.find(c => c.id === id);
}

export function getUser(id: string) {
    return users.find(u => u.id === id);
}

export function getOrganization(id: string) {
    return organizations.find(org => org.id === id);
}

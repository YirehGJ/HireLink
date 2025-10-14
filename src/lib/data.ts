
import type { User, Job, Candidate, Recommendation, Application, Organization } from './types';

export const users: User[] = [
  { id: 'user-admin', email: 'admin@test.com', fullName: 'Admin User', role: 'admin', status: 'active' },
  { id: 'user-recruiter', email: 'brand@test.com', fullName: 'Brand Recruiter', role: 'recruiter', status: 'active', organizationRef: 'org-1' },
  { id: 'user-dev', email: 'dev@test.com', fullName: 'Dev Candidate', role: 'candidate', status: 'active' },
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
    id: 'candidate-dev',
    userRef: 'user-dev',
    headline: 'Full-stack Developer',
    location: 'Remote',
    yearsOfExperience: 5,
    available: true,
    skills: [
      { name: 'React', level: 5, years: 5, source: 'resume' },
      { name: 'TypeScript', level: 4, years: 4, source: 'resume' },
      { name: 'Node.js', level: 4, years: 3, source: 'resume' },
      { name: 'GraphQL', level: 3, years: 2, source: 'resume' },
    ],
  },
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
];

export const recommendations: Recommendation[] = [
    {
        id: 'rec-1',
        candidateRef: 'candidate-dev',
        jobRef: 'job-1',
        score: 0.85,
        reasons: ['Strong React skills', 'TypeScript experience', 'Leadership potential'],
        engineVersion: '1.0.0',
        createdAt: new Date(),
    }
];

export const applications: Application[] = [
    {
        id: 'app-1',
        candidateRef: 'candidate-dev',
        jobRef: 'job-2',
        status: 'interview',
        source: 'recommendation',
        cvRef: 'cv.pdf',
        appliedAt: new Date(2024, 6, 15),
        updatedAt: new Date(2024, 6, 16),
    }
];

export function getJob(id: string) {
    return jobs.find(job => job.id === id);
}

export function getCandidate(id: string) {
    return candidates.find(c => c.id === id);
}

export function getCandidateByUserId(userId: string) {
    return candidates.find(c => c.userRef === userId);
}

export function getUser(id: string) {
    return users.find(u => u.id === id);
}

export function getOrganization(id: string) {
    return organizations.find(org => org.id === id);
}

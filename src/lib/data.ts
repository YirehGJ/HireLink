
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
        headline: 'Senior Frontend Developer',
        location: 'Remote',
        yearsOfExperience: 8,
        available: true,
        skills: [
            { name: 'React', level: 5, years: 6, source: 'manual' },
            { name: 'TypeScript', level: 5, years: 5, source: 'manual' },
            { name: 'Next.js', level: 4, years: 4, source: 'cv' },
            { name: 'GraphQL', level: 3, years: 3, source: 'cv' },
            { name: 'Team Leadership', level: 4, years: 2, source: 'manual' },
        ],
        resumeRef: 'resume-dev.pdf'
    },
];

export const jobs: Job[] = [
    {
        id: 'job-1',
        organizationRef: 'org-1',
        title: 'Senior Frontend Engineer (React)',
        descriptionMd: 'We are looking for a seasoned Frontend Engineer to join our team. You will be responsible for building and maintaining our web applications using React, Next.js, and TypeScript. You should have a strong understanding of modern web development principles and best practices.',
        location: 'Remote',
        remoteAllowed: true,
        contractType: 'Full-time',
        seniority: 'senior',
        status: 'published',
        searchTags: ['React', 'TypeScript', 'Next.js', 'Frontend'],
    },
    {
        id: 'job-2',
        organizationRef: 'org-1',
        title: 'Backend Developer (Node.js)',
        descriptionMd: 'Join our backend team to design, develop, and maintain our server-side applications. You will work with Node.js, Express, and PostgreSQL to build scalable and reliable APIs. Experience with microservices and cloud platforms is a plus.',
        location: 'Mexico City, Mexico',
        remoteAllowed: false,
        contractType: 'Full-time',
        seniority: 'mid',
        status: 'published',
        searchTags: ['Node.js', 'Express', 'PostgreSQL', 'Backend'],
    },
     {
        id: 'job-3',
        organizationRef: 'org-1',
        title: 'UI/UX Designer',
        descriptionMd: 'We are seeking a talented UI/UX Designer to create amazing user experiences. The ideal candidate should have an eye for clean and artful design, possess superior UI skills and be able to translate high-level requirements into interaction flows and artifacts, and transform them into beautiful, intuitive, and functional user interfaces.',
        location: 'Remote',
        remoteAllowed: true,
        contractType: 'Part-time',
        seniority: 'junior',
        status: 'draft',
        searchTags: ['UI', 'UX', 'Figma', 'Design System'],
    }
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

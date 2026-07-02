import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertDemoUsers() {
  const studentPasswordHash = await bcrypt.hash('Student@123', 12);
  const counselorPasswordHash = await bcrypt.hash('Counselor@123', 12);

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {
      passwordHash: studentPasswordHash,
      name: 'Minh Nguyen',
      role: UserRole.STUDENT
    },
    create: {
      email: 'student@example.com',
      passwordHash: studentPasswordHash,
      name: 'Minh Nguyen',
      role: UserRole.STUDENT,
      profile: {
        create: {
          headline: 'Software engineering student interested in backend systems',
          location: 'Ho Chi Minh City',
          university: 'FPT University',
          major: 'Software Engineering',
          graduationYear: 2027,
          gpa: 3.35,
          careerInterests: ['Backend Developer', 'Cloud APIs', 'Database Design'],
          courses: [
            { code: 'PRN212', name: '.NET and backend fundamentals', grade: 'B+' },
            { code: 'SWP391', name: 'Software development project', grade: 'A' }
          ],
          transcriptName: 'manual-entry'
        }
      }
    }
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      headline: 'Software engineering student interested in backend systems',
      location: 'Ho Chi Minh City',
      university: 'FPT University',
      major: 'Software Engineering',
      graduationYear: 2027,
      gpa: 3.35,
      careerInterests: ['Backend Developer', 'Cloud APIs', 'Database Design'],
      courses: [
        { code: 'PRN212', name: '.NET and backend fundamentals', grade: 'B+' },
        { code: 'SWP391', name: 'Software development project', grade: 'A' }
      ],
      transcriptName: 'manual-entry'
    }
  });

  await prisma.user.upsert({
    where: { email: 'counselor@example.com' },
    update: {
      passwordHash: counselorPasswordHash,
      name: 'Counselor Admin',
      role: UserRole.COUNSELOR_ADMIN
    },
    create: {
      email: 'counselor@example.com',
      passwordHash: counselorPasswordHash,
      name: 'Counselor Admin',
      role: UserRole.COUNSELOR_ADMIN
    }
  });
}

upsertDemoUsers()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Demo users are ready.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

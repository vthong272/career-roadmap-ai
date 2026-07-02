-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'COUNSELOR_ADMIN');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('COURSE', 'DOCUMENTATION', 'VIDEO', 'ARTICLE', 'PROJECT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "avatarUrl" TEXT,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "location" TEXT,
    "university" TEXT,
    "major" TEXT,
    "graduationYear" INTEGER,
    "gpa" DOUBLE PRECISION,
    "careerInterests" JSONB NOT NULL DEFAULT '[]',
    "courses" JSONB NOT NULL DEFAULT '[]',
    "transcriptName" TEXT,
    "targetRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerRole" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "demandLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSkillRequirement" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "requiredLevel" "SkillLevel" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RoleSkillRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningNode" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "skillId" TEXT,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "estimatedHours" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningResource" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "status" "RoadmapStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRepository" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "readmeSummary" TEXT,

    CONSTRAINT "GitHubRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSkill_userId_skillId_key" ON "StudentSkill"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerRole_slug_key" ON "CareerRole"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RoleSkillRequirement_roleId_skillId_key" ON "RoleSkillRequirement"("roleId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapProgress_userId_nodeId_key" ON "RoadmapProgress"("userId", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubProfile_userId_key" ON "GitHubProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepository_profileId_name_key" ON "GitHubRepository"("profileId", "name");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_targetRoleId_fkey" FOREIGN KEY ("targetRoleId") REFERENCES "CareerRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkillRequirement" ADD CONSTRAINT "RoleSkillRequirement_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CareerRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkillRequirement" ADD CONSTRAINT "RoleSkillRequirement_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNode" ADD CONSTRAINT "LearningNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LearningNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNode" ADD CONSTRAINT "LearningNode_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CareerRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNode" ADD CONSTRAINT "LearningNode_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningResource" ADD CONSTRAINT "LearningResource_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "LearningNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapProgress" ADD CONSTRAINT "RoadmapProgress_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "LearningNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapProgress" ADD CONSTRAINT "RoadmapProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubProfile" ADD CONSTRAINT "GitHubProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepository" ADD CONSTRAINT "GitHubRepository_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "GitHubProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;


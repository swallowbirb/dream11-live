-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "favouriteTeam" TEXT,
    "slowModeSecs" INTEGER NOT NULL DEFAULT 0,
    "subsOnly" BOOLEAN NOT NULL DEFAULT false,
    "followersOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Channel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("followerId", "channelId"),
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "sport" TEXT NOT NULL DEFAULT 'cricket',
    "tournament" TEXT NOT NULL,
    "teamA" TEXT NOT NULL,
    "teamB" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "scoreJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "matchId" TEXT,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "supportingTeam" TEXT,
    "status" TEXT NOT NULL DEFAULT 'starting',
    "providerRef" TEXT,
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "Stream_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Stream_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "teamBadge" TEXT,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReactionTotal" (
    "streamId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("streamId", "emoji"),
    CONSTRAINT "ReactionTotal_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "streamId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Poll_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollVote" (
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionIndex" INTEGER NOT NULL,

    PRIMARY KEY ("pollId", "userId"),
    CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "streamId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Clip_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Clip_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayPrice" TEXT NOT NULL,
    "perks" TEXT NOT NULL,
    "badgeUrl" TEXT,
    "rank" INTEGER NOT NULL,
    CONSTRAINT "SubTier_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "SubTier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Moderator" (
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("channelId", "userId"),
    CONSTRAINT "Moderator_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Moderator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ban" (
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "reason" TEXT,
    "byUserId" TEXT NOT NULL,

    PRIMARY KEY ("channelId", "userId"),
    CONSTRAINT "Ban_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ban_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockedWord" (
    "channelId" TEXT NOT NULL,
    "word" TEXT NOT NULL,

    PRIMARY KEY ("channelId", "word"),
    CONSTRAINT "BlockedWord_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModAction_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL DEFAULT '{}',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_userId_key" ON "Channel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_externalId_key" ON "Match"("externalId");

-- CreateIndex
CREATE INDEX "ChatMessage_streamId_createdAt_idx" ON "ChatMessage"("streamId", "createdAt");

CREATE TABLE `subscriptions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `authUserId` varchar(64) NOT NULL,
  `plan` enum('free','pro') NOT NULL DEFAULT 'free',
  `status` enum('active','trialing','past_due','canceled','paused') NOT NULL DEFAULT 'active',
  `provider` varchar(32),
  `providerCustomerId` varchar(191),
  `providerSubscriptionId` varchar(191),
  `currentPeriodEndsAt` timestamp NULL,
  `cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
  KEY `subscriptions_auth_user_idx` (`authUserId`),
  KEY `subscriptions_provider_customer_idx` (`providerCustomerId`),
  KEY `subscriptions_provider_subscription_idx` (`providerSubscriptionId`)
);

CREATE TABLE `billing_webhook_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `provider` varchar(32) NOT NULL,
  `providerEventId` varchar(191) NOT NULL,
  `eventType` varchar(120) NOT NULL,
  `payload` text NOT NULL,
  `processedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `billing_webhook_events_id` PRIMARY KEY(`id`),
  CONSTRAINT `billing_webhook_events_providerEventId_unique` UNIQUE(`providerEventId`)
);

CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36),
	`name` varchar(160) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(32),
	`password_hash` varchar(255) NOT NULL,
	`role` enum('ADMIN','EVENT_MANAGER','RECEPTIONIST') NOT NULL DEFAULT 'RECEPTIONIST',
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`description` text,
	`venue` varchar(255),
	`capacity` int,
	`registration_start` timestamp,
	`registration_end` timestamp,
	`event_start` timestamp,
	`event_end` timestamp,
	`ticket_valid_from` timestamp,
	`ticket_valid_until` timestamp,
	`committee_json` json,
	`banner` varchar(500),
	`status` enum('DRAFT','PUBLISHED','ONGOING','FINISHED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`title` varchar(32),
	`name` varchar(160) NOT NULL,
	`company` varchar(160),
	`job_title` varchar(160),
	`phone` varchar(32) NOT NULL,
	`email` varchar(255) NOT NULL,
	`participant_type` varchar(80),
	`status` enum('INVITED','PENDING','WAITLIST','APPROVED','REJECTED','CANCELLED','CHECKED_IN','NO_SHOW') NOT NULL DEFAULT 'PENDING',
	`registered_at` timestamp,
	`approved_at` timestamp,
	`approved_by` varchar(36),
	`rejected_at` timestamp,
	`rejection_reason` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`participant_id` varchar(36) NOT NULL,
	`ticket_number` varchar(120) NOT NULL,
	`qr_token` varchar(255) NOT NULL,
	`status` enum('ACTIVE','USED','EXPIRED','REVOKED') NOT NULL DEFAULT 'ACTIVE',
	`valid_from` timestamp NOT NULL,
	`valid_until` timestamp NOT NULL,
	`issued_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_ticket_number_unique` UNIQUE(`ticket_number`),
	CONSTRAINT `tickets_qr_token_unique` UNIQUE(`qr_token`)
);
--> statement-breakpoint
CREATE TABLE `checkins` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`participant_id` varchar(36) NOT NULL,
	`ticket_id` varchar(36),
	`checkin_method` enum('QR','MANUAL') NOT NULL,
	`checked_in_at` timestamp NOT NULL,
	`checked_in_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`type` varchar(80) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`recipient_json` json NOT NULL,
	`content_json` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `participants` ADD CONSTRAINT `participants_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `participants` ADD CONSTRAINT `participants_approved_by_users_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_participant_id_participants_id_fk` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkins` ADD CONSTRAINT `checkins_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkins` ADD CONSTRAINT `checkins_participant_id_participants_id_fk` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkins` ADD CONSTRAINT `checkins_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkins` ADD CONSTRAINT `checkins_checked_in_by_users_id_fk` FOREIGN KEY (`checked_in_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_templates` ADD CONSTRAINT `email_templates_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `events_created_by_idx` ON `events` (`created_by`);--> statement-breakpoint
CREATE INDEX `participants_event_idx` ON `participants` (`event_id`);--> statement-breakpoint
CREATE INDEX `participants_status_idx` ON `participants` (`status`);--> statement-breakpoint
CREATE INDEX `participants_email_idx` ON `participants` (`email`);--> statement-breakpoint
CREATE INDEX `participants_phone_idx` ON `participants` (`phone`);
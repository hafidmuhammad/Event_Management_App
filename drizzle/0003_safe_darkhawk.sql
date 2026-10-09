CREATE TABLE `activity_logs` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`actor_id` varchar(36),
	`action` varchar(80) NOT NULL,
	`summary` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_broadcasts` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`template_name` varchar(160) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`transport` varchar(20) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'RUNNING',
	`requested` int NOT NULL DEFAULT 0,
	`sent` int NOT NULL DEFAULT 0,
	`failed` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_deliveries` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`broadcast_id` varchar(36),
	`recipient` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` varchar(20) NOT NULL,
	`transport` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_broadcasts` ADD CONSTRAINT `email_broadcasts_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD CONSTRAINT `email_deliveries_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD CONSTRAINT `email_deliveries_broadcast_id_email_broadcasts_id_fk` FOREIGN KEY (`broadcast_id`) REFERENCES `email_broadcasts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_event_time_idx` ON `activity_logs` (`event_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `broadcast_event_time_idx` ON `email_broadcasts` (`event_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `delivery_event_status_idx` ON `email_deliveries` (`event_id`,`status`);
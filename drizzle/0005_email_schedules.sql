CREATE TABLE `email_schedules` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`template_id` varchar(36) NOT NULL,
	`offset_minutes` int NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`broadcast_id` varchar(36),
	`last_error` varchar(500),
	`started_at` timestamp,
	`finished_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_schedules` ADD CONSTRAINT `email_schedules_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_schedules` ADD CONSTRAINT `email_schedules_template_id_email_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `email_schedules_event_idx` ON `email_schedules` (`event_id`);--> statement-breakpoint
CREATE INDEX `email_schedules_status_idx` ON `email_schedules` (`status`);
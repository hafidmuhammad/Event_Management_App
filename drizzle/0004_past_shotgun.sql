CREATE TABLE `contact_lists` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` varchar(500),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` varchar(36) NOT NULL,
	`list_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(255) NOT NULL,
	`company` varchar(160),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `contact_list_email_unique` UNIQUE(`list_id`,`email`)
);
--> statement-breakpoint
CREATE TABLE `global_email_templates` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` varchar(500),
	`type` varchar(80) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`content_json` json NOT NULL,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `global_email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_list_id_contact_lists_id_fk` FOREIGN KEY (`list_id`) REFERENCES `contact_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contact_list_name_idx` ON `contact_lists` (`name`);--> statement-breakpoint
CREATE INDEX `global_template_name_idx` ON `global_email_templates` (`name`);
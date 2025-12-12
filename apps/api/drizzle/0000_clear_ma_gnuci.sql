CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_conversations" uuid NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"content" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_conversations_chat_conversations_id_fk" FOREIGN KEY ("chat_conversations") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
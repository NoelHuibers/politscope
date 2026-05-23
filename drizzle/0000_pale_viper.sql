CREATE TYPE "public"."party" AS ENUM('cdu', 'spd', 'grn', 'fdp', 'lnk', 'afd', 'csu', 'bsw', 'none');--> statement-breakpoint
CREATE TABLE "mps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ext_id" text NOT NULL,
	"name" text NOT NULL,
	"party" "party" NOT NULL,
	"role" text,
	"since" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wahlperiode" smallint NOT NULL,
	"sitzung" smallint NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speech_embeddings" (
	"speech_id" uuid PRIMARY KEY NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"model" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speeches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"mp_id" uuid,
	"top" smallint,
	"word_count" integer NOT NULL,
	"text" text NOT NULL,
	"topic_id" text,
	"umap_x" integer,
	"umap_y" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "speech_embeddings" ADD CONSTRAINT "speech_embeddings_speech_id_speeches_id_fk" FOREIGN KEY ("speech_id") REFERENCES "public"."speeches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_mp_id_mps_id_fk" FOREIGN KEY ("mp_id") REFERENCES "public"."mps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mps_ext_id_idx" ON "mps" USING btree ("ext_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_wp_sitzung_idx" ON "sessions" USING btree ("wahlperiode","sitzung");--> statement-breakpoint
CREATE INDEX "sessions_date_idx" ON "sessions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "speech_embeddings_hnsw_idx" ON "speech_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "speeches_session_idx" ON "speeches" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "speeches_mp_idx" ON "speeches" USING btree ("mp_id");--> statement-breakpoint
CREATE INDEX "speeches_topic_idx" ON "speeches" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "speeches_fts_idx" ON "speeches" USING gin (to_tsvector('german', "text"));
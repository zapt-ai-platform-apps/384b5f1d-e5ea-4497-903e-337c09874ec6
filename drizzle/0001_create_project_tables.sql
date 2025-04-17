-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "project_name" TEXT NOT NULL,
  "project_description" TEXT NOT NULL,
  "form_of_contract" TEXT NOT NULL,
  "organization_role" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS "issues" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "action_taken" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS "reports" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);
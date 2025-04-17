import { pgTable, serial, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  projectName: text('project_name').notNull(),
  projectDescription: text('project_description').notNull(),
  formOfContract: text('form_of_contract').notNull(),
  organizationRole: text('organization_role').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  actionTaken: text('action_taken'),
  createdAt: timestamp('created_at').defaultNow()
});

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
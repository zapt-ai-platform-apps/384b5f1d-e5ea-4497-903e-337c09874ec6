import { authenticateUser, getDatabaseConnection } from './_apiUtils.js';
import { projects, issues, reports } from '../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import * as Sentry from '@sentry/node';

export default async function handler(req, res) {
  console.log(`Received ${req.method} request to /api/project`);
  
  try {
    const user = await authenticateUser(req);
    const db = getDatabaseConnection();
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Missing project ID' });
    }
    
    console.log(`Fetching project with ID: ${projectId}`);
    
    // Get the project
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, parseInt(projectId)),
        eq(projects.userId, user.id)
      ));
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Get the issues
    const projectIssues = await db.select()
      .from(issues)
      .where(eq(issues.projectId, parseInt(projectId)));
    
    // Get the report
    const [projectReport] = await db.select()
      .from(reports)
      .where(eq(reports.projectId, parseInt(projectId)));
    
    return res.status(200).json({
      projectDetails: {
        projectName: project.projectName,
        projectDescription: project.projectDescription,
        formOfContract: project.formOfContract,
        organizationRole: project.organizationRole
      },
      issues: projectIssues.map(issue => ({
        id: issue.id,
        description: issue.description,
        actionTaken: issue.actionTaken
      })),
      report: projectReport ? projectReport.content : null
    });
    
  } catch (error) {
    console.error('Error in project API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
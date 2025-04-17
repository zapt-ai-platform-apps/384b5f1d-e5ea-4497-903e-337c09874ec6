import { authenticateUser, getDatabaseConnection } from './_apiUtils.js';
import { projects, issues, reports } from '../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import * as Sentry from '@sentry/node';

export default async function handler(req, res) {
  console.log(`Received ${req.method} request to /api/projects`);
  
  try {
    const user = await authenticateUser(req);
    const db = getDatabaseConnection();
    
    // GET: Fetch all projects for the user
    if (req.method === 'GET') {
      console.log(`Fetching projects for user: ${user.id}`);
      
      const userProjects = await db.select()
        .from(projects)
        .where(eq(projects.userId, user.id))
        .orderBy(projects.createdAt);
      
      console.log(`Found ${userProjects.length} projects for user`);
      return res.status(200).json({ projects: userProjects });
    }
    
    // POST: Create a new project
    if (req.method === 'POST') {
      console.log('Creating a new project');
      const { projectDetails, issues: projectIssues, report } = req.body;
      
      if (!projectDetails || !projectIssues) {
        return res.status(400).json({ error: 'Missing required project data' });
      }
      
      // Insert the project and get the ID
      const [newProject] = await db.insert(projects)
        .values({
          userId: user.id,
          projectName: projectDetails.projectName,
          projectDescription: projectDetails.projectDescription,
          formOfContract: projectDetails.formOfContract,
          organizationRole: projectDetails.organizationRole
        })
        .returning();
      
      console.log(`Project created with ID: ${newProject.id}`);
      
      // Insert all issues
      const issueValues = projectIssues.map(issue => ({
        projectId: newProject.id,
        description: issue.description,
        actionTaken: issue.actionTaken || null
      }));
      
      await db.insert(issues).values(issueValues);
      console.log(`Added ${issueValues.length} issues to project`);
      
      // If a report is provided, save it
      if (report) {
        await db.insert(reports).values({
          projectId: newProject.id,
          content: report
        });
        console.log('Added report to project');
      }
      
      return res.status(201).json({ 
        message: 'Project created successfully',
        projectId: newProject.id
      });
    }
    
    // PUT: Update an existing project
    if (req.method === 'PUT') {
      const { projectId } = req.query;
      const { projectDetails, issues: projectIssues, report } = req.body;
      
      if (!projectId || !projectDetails || !projectIssues) {
        return res.status(400).json({ error: 'Missing required project data' });
      }
      
      console.log(`Updating project with ID: ${projectId}`);
      
      // First, verify this project belongs to the user
      const [existingProject] = await db.select()
        .from(projects)
        .where(and(
          eq(projects.id, parseInt(projectId)),
          eq(projects.userId, user.id)
        ));
      
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }
      
      // Update project details
      await db.update(projects)
        .set({
          projectName: projectDetails.projectName,
          projectDescription: projectDetails.projectDescription,
          formOfContract: projectDetails.formOfContract,
          organizationRole: projectDetails.organizationRole,
          updatedAt: new Date()
        })
        .where(eq(projects.id, parseInt(projectId)));
      
      // Delete existing issues and add new ones
      await db.delete(issues).where(eq(issues.projectId, parseInt(projectId)));
      
      const issueValues = projectIssues.map(issue => ({
        projectId: parseInt(projectId),
        description: issue.description,
        actionTaken: issue.actionTaken || null
      }));
      
      await db.insert(issues).values(issueValues);
      
      // Update or insert report
      if (report) {
        const existingReport = await db.select()
          .from(reports)
          .where(eq(reports.projectId, parseInt(projectId)));
        
        if (existingReport.length > 0) {
          await db.update(reports)
            .set({ content: report })
            .where(eq(reports.projectId, parseInt(projectId)));
        } else {
          await db.insert(reports).values({
            projectId: parseInt(projectId),
            content: report
          });
        }
      }
      
      return res.status(200).json({ message: 'Project updated successfully' });
    }
    
    // DELETE: Delete a project
    if (req.method === 'DELETE') {
      const { projectId } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ error: 'Missing project ID' });
      }
      
      console.log(`Deleting project with ID: ${projectId}`);
      
      // Verify this project belongs to the user
      const [existingProject] = await db.select()
        .from(projects)
        .where(and(
          eq(projects.id, parseInt(projectId)),
          eq(projects.userId, user.id)
        ));
      
      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }
      
      // Delete the project (cascade will handle issues and report)
      await db.delete(projects).where(eq(projects.id, parseInt(projectId)));
      
      return res.status(200).json({ message: 'Project deleted successfully' });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Error in projects API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
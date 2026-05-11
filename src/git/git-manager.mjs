/**
 * Maverick Hunter — Git Manager
 * Handles project detection, branch creation, and commit management.
 * 
 * Strategy:
 * 1. Check if the task mentions an existing project in the workspace
 * 2. If found → cd to it, create a branch
 * 3. If not → create a new directory, git init, create a branch
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.mjs';
import { log } from '../logger/logger.mjs';

/**
 * Sanitize a string for use as a branch name.
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 40);
}

/**
 * Run a git command in the specified directory.
 * @param {string} cmd - Git command (without 'git' prefix)
 * @param {string} cwd - Working directory
 * @returns {string} - Command output
 */
function git(cmd, cwd) {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    log.warn(`  ⚠️ Git command failed: git ${cmd} → ${error.message}`);
    return '';
  }
}

/**
 * Check if a directory is a git repository.
 * @param {string} dir
 * @returns {boolean}
 */
function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

/**
 * Resolve the project directory for a given task.
 * Tries to match the task title/description against existing project names.
 * 
 * @param {Object} quest - The quest object
 * @returns {string} - Project name to use
 */
export function resolveProjectName(quest) {
  const workspaceDir = CONFIG.WORKSPACE_DIR;

  // Skip maverick-hunter itself
  const skipDirs = new Set(['maverick-hunter', 'node_modules', '.git']);

  // List existing projects in workspace
  let existingProjects = [];
  try {
    existingProjects = fs.readdirSync(workspaceDir).filter(name => {
      if (skipDirs.has(name)) return false;
      const fullPath = path.join(workspaceDir, name);
      return fs.statSync(fullPath).isDirectory();
    });
  } catch {
    existingProjects = [];
  }

  // Try to match task title or description against existing project names
  const searchText = `${quest.title} ${quest.description || ''}`.toLowerCase();

  for (const proj of existingProjects) {
    if (searchText.includes(proj.toLowerCase())) {
      log.info(`  📂 Matched existing project: ${proj}`);
      return proj;
    }
  }

  // Generate a new project name from the title
  const generated = sanitize(quest.title) || `task-${quest.id}`;
  log.info(`  📁 New project will be created: ${generated}`);
  return generated;
}

/**
 * Prepare the workspace for a task:
 * - Detect or create the project directory
 * - Initialize git if needed
 * - Create a feature branch
 * 
 * @param {Object} quest - The quest object with id, title, etc.
 * @returns {{ workDir: string, branch: string, projectName: string }}
 */
export function prepareWorkspace(quest) {
  const projectName = resolveProjectName(quest);
  const workDir = path.join(CONFIG.WORKSPACE_DIR, projectName);
  const branchName = `maverick/task-${sanitize(quest.id)}-${sanitize(quest.title)}`.substring(0, 80);

  // Create directory if it doesn't exist
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
    log.info(`  📂 Created directory: ${workDir}`);
  }

  // Initialize git if not a repo
  if (!isGitRepo(workDir)) {
    git('init', workDir);
    git('checkout -b main', workDir);

    // Create initial commit so branches work
    const readmePath = path.join(workDir, 'README.md');
    fs.writeFileSync(readmePath, `# ${projectName}\n\nCreated by Maverick Hunter 🤖\n`, 'utf-8');
    git('add .', workDir);
    git('commit -m "🤖 [MaverickHunter] Initial commit"', workDir);
    log.info(`  🔧 Initialized git repo with main branch`);
  }

  // Ensure we're on a clean state before branching
  try {
    // Stash any uncommitted changes
    git('stash', workDir);
    // Go back to main/master
    const defaultBranch = git('rev-parse --abbrev-ref HEAD', workDir) || 'main';
    if (defaultBranch !== 'main' && defaultBranch !== 'master') {
      // Try to checkout main or master
      const branches = git('branch', workDir);
      if (branches.includes('main')) {
        git('checkout main', workDir);
      } else if (branches.includes('master')) {
        git('checkout master', workDir);
      }
    }
  } catch {
    // If anything fails, continue anyway
  }

  // Create the feature branch
  git(`checkout -b ${branchName}`, workDir);
  log.info(`  🌿 Created branch: ${branchName}`);

  return { workDir, branch: branchName, projectName };
}

/**
 * Commit all changes made by the AI executor.
 * @param {string} workDir
 * @param {Object} quest - The quest object
 */
export function commitChanges(workDir, quest) {
  try {
    // Check if there are any changes to commit
    const status = git('status --porcelain', workDir);
    if (!status) {
      log.info(`  📋 No changes to commit`);
      return;
    }

    git('add -A', workDir);
    const message = `🤖 [MaverickHunter] ${quest.agentLabel}: ${quest.title}`;
    git(`commit -m "${message}"`, workDir);
    log.info(`  ✅ Committed: ${message}`);
  } catch (error) {
    log.warn(`  ⚠️ Commit failed: ${error.message}`);
  }
}

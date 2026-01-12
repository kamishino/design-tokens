/**
 * Archive Task Files Script
 * Moves all task files from tasks/ to tasks/_archived/
 * Creates the _archived directory if it doesn't exist
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const TASKS_DIR = path.join(__dirname, '../tasks');
const ARCHIVED_DIR = path.join(TASKS_DIR, '_archived');

async function archiveTasks() {
  console.log(chalk.blue('📦 Archiving task files...\n'));

  try {
    // Ensure the archived directory exists
    await fs.ensureDir(ARCHIVED_DIR);
    console.log(chalk.gray(`✓ Created/verified archive directory: ${path.relative(process.cwd(), ARCHIVED_DIR)}`));

    // Get all files in the tasks directory (excluding directories and _archived)
    const files = await fs.readdir(TASKS_DIR);
    const taskFiles = files.filter(file => {
      const filePath = path.join(TASKS_DIR, file);
      const stat = fs.statSync(filePath);
      return stat.isFile() && file !== '_archived';
    });

    if (taskFiles.length === 0) {
      console.log(chalk.yellow('⚠ No task files found to archive'));
      return;
    }

    console.log(chalk.gray(`Found ${taskFiles.length} task files to archive:\n`));

    // Move each file to the archived directory
    let movedCount = 0;
    for (const file of taskFiles) {
      const sourcePath = path.join(TASKS_DIR, file);
      const targetPath = path.join(ARCHIVED_DIR, file);
      
      // Check if file already exists in archive
      if (await fs.pathExists(targetPath)) {
        console.log(chalk.yellow(`⚠ Skipping ${file} - already exists in archive`));
        continue;
      }

      await fs.move(sourcePath, targetPath);
      console.log(chalk.green(`  ✓ ${file}`));
      movedCount++;
    }

    console.log(chalk.green(`\n✅ Successfully archived ${movedCount} task files`));
    console.log(chalk.gray(`  Archive location: ${path.relative(process.cwd(), ARCHIVED_DIR)}`));
    
    // Show what's left in the tasks directory
    const remainingFiles = await fs.readdir(TASKS_DIR);
    const remaining = remainingFiles.filter(file => {
      const filePath = path.join(TASKS_DIR, file);
      const stat = fs.statSync(filePath);
      return stat.isFile() && file !== '_archived';
    });

    if (remaining.length > 0) {
      console.log(chalk.yellow(`\n⚠ ${remaining.length} files remain in tasks/ (may be in use):`));
      remaining.forEach(file => console.log(chalk.gray(`  - ${file}`)));
    } else {
      console.log(chalk.green(`\n✓ All task files archived - tasks/ directory is now clean`));
    }

  } catch (error) {
    console.error(chalk.red('✗ Archive failed:'), error.message);
    process.exit(1);
  }
}

// Run the archive function
archiveTasks();

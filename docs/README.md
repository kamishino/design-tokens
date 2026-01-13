# 📚 Documentation Index

Welcome to the Design Token Manager documentation. This guide helps you navigate all available documentation based on your needs.

---

## 🚀 Getting Started

Start here if you're new to the project:

### [Setup Guide](./setup/SETUP.md)
Complete infrastructure setup guide for new projects.

**Topics covered:**
- Prerequisites and requirements
- Automated project scaffolding with `npm run project:clone`
- Supabase backend setup with quickstart SQL
- Environment configuration (`.env` setup)
- Connection testing and verification
- Troubleshooting common issues

**Estimated time:** 10-15 minutes

---

### [Dashboard Setup](./setup/SETUP_DASHBOARD.md)
Initial dashboard configuration and first-time setup.

**Topics covered:**
- Dashboard overview
- Initial project configuration
- User interface walkthrough

---

## 👥 For Daily Users

Essential guides for everyday token management:

### [User Guide](./user/GUIDE.md)
Complete daily workflow and collaboration guide.

**Topics covered:**
- Figma Token Studio setup and sync
- Production vs Sandbox mode
- Token editing workflow (create, edit, delete)
- Publishing changes to production
- Common commands reference
- Best practices and conventions

**Who should read this:** Designers, developers, and anyone editing tokens regularly.

---

## 🔧 For Developers

Advanced topics for developers maintaining or extending the system:

### [Development Workflow](./development/WORKFLOW.md)
Development practices and contribution guidelines.

**Topics covered:**
- Development environment setup
- Coding standards and conventions
- Testing and quality assurance
- Contribution workflow
- Pull request guidelines

**Who should read this:** Contributors, maintainers, and developers extending the system.

---

## 🗄️ Database & Infrastructure

### [Supabase Schema](../database/supabase-schema.sql)
Complete database schema for collaborative features.

**Includes:**
- `projects` table for multi-project support
- `token_drafts` table for sandbox collaboration
- Row Level Security (RLS) policies
- Indexes for performance

**Usage:** Run this SQL in Supabase SQL Editor to set up the backend.

---

## 📖 Quick Reference

### By Role

| Role | Start Here | Then Read |
|------|------------|-----------|
| **New Developer** | [Setup Guide](./setup/SETUP.md) | [Development Workflow](./development/WORKFLOW.md) |
| **Designer** | [Setup Guide](./setup/SETUP.md) | [User Guide](./user/GUIDE.md) |
| **Project Manager** | [Dashboard Setup](./setup/SETUP_DASHBOARD.md) | [User Guide](./user/GUIDE.md) |
| **Contributor** | [Development Workflow](./development/WORKFLOW.md) | [User Guide](./user/GUIDE.md) |

### By Task

| Task | Documentation |
|------|---------------|
| Setting up a new project | [Setup Guide](./setup/SETUP.md) |
| Connecting Figma to GitHub | [User Guide - Figma Setup](./user/GUIDE.md#figma-token-studio-setup) |
| Editing tokens | [User Guide - Token Editing](./user/GUIDE.md#token-editing-workflow) |
| Publishing changes | [User Guide - Publishing](./user/GUIDE.md#publishing-changes) |
| Troubleshooting setup | [Setup Guide - Troubleshooting](./setup/SETUP.md#troubleshooting) |
| Contributing code | [Development Workflow](./development/WORKFLOW.md) |

---

## 🔗 Additional Resources

- **[Main README](../README.md)** - Project overview and feature list
- **[CHANGELOG](../CHANGELOG.md)** - Version history and release notes
- **[LICENSE](../LICENSE)** - MIT License terms
- **[.env.example](../.env.example)** - Environment variable template

---

## 🆘 Getting Help

**Can't find what you're looking for?**

1. Check the [Troubleshooting sections](#) in relevant guides
2. Search existing [GitHub Issues](https://github.com/your-org/design-tokens/issues)
3. Open a new issue with details about your question

**Found an error in the docs?**

Please open a pull request or issue to help us improve!

---

*Last updated: 2026-01-13*

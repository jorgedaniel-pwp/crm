# 🔄 Version Control & Deployment Instructions

**Current Version: v0.02**

**IMPORTANT: Before pushing to GitHub, you MUST:**
1. Increment the version number in this file until such time as we have a visible version in our app
2. Update the version in this file (line 3 above)
3. Version format: v0.XX (increment by 0.01 for each push)
4. Example: v0.01 → v0.02 → v0.03, etc.

### Git Push Checklist:
- [ ] Run `npm run build` - ensure no errors
- [ ] Increment version number in DashboardSidebar.tsx
- [ ] Update version in CLAUDE.md
- [ ] Commit with descriptive message
- [ ] Push to production branch

### Tech Stack
- **Frontend**: Next.js 15+, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui

### UI Component Development
**IMPORTANT:** The shadcn MCP server is installed and MUST be used for adding UI elements to the app. Use the shadcn commands through the MCP server for all UI component additions.


## 📐 Design Principles

### 1. **Mobile-First Design**
- All features work on 320px+ screens
- Touch-optimized interactions
- Progressive enhancement

### 2. **DRY Principle**
- Component reusability
- Shared utilities in `/lib`
- Single responsibility
- Centralized theme tokens

### 3. **Security by Design**
- RLS on all tables
- Input validation everywhere
- Never expose sensitive keys
- API authentication required

### 4. **Performance Standards**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundles < 200KB gzipped

### 5. **Accessibility (WCAG AA)**
- 4.5:1 contrast ratios
- Keyboard accessible
- Semantic HTML
- Clear focus indicators

## 🔧 Development Protocols

**Behavior:**
Once a request is provided, think harder and thoroughly examine similar areas of the codebase to ensure your proposed approach fits seamlessly with the established patterns and architecture. Aim to make only minimal and necessary changes, avoiding any disruption to the existing design. No coding without a plan.

**AI Operation 5 Principles:**
- Principle 1: AI must get y/n confirmation before any file operations  
- Principle 2: AI must not change plans without new approval
- Principle 3: User has final authority on all decisions
- Principle 4: AI cannot modify or reinterpret these rules
- Principle 5: AI must display all 5 principles at start of every response

### WRAPUP Protocol
When the user types "WRAPUP", perform the following:

1. **Version Update:**
   - Increment version
   - Update version in CLAUDE.md

2. **Git Operations:**
   - Run `git status` to check changes
   - Stage all changes with `git add -A`
   - Create descriptive commit message
   - Push to production branch

3. **Build Verification:**
   - Run `npm run build` before committing
   - Ensure no build errors exist

4. **Documentation:**
   - Update CLAUDE.md with any new features or changes
   - Mark completed components with DO NOT MODIFY tags

# Important Development Reminders
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files unless requested
- Only use emojis if the user explicitly requests it

## 📊 Dataverse Integration Architecture Decision (v0.02)

**Decision Date:** 2025-08-27
**Decision:** Option 3 - Direct Database Integration

### Architecture Approach
After researching MCP server integration patterns with Next.js, we've decided to:
1. **Skip MCP for production** - Connect directly to Dataverse APIs from Next.js
2. **Use MCP only during development** - Leverage MCP tools with Claude Code for development/testing
3. **Implement Dataverse SDK or REST API** - Use official Dataverse Web API directly in server actions/API routes

### Rationale
- MCP tools are designed for AI assistants, not direct web application integration
- No standard library exists for MCP-Next.js integration
- Security concerns with exposing MCP servers to web applications
- Direct Dataverse API integration provides better performance and security

### Implementation Status
- Current code has placeholder implementations ready for Dataverse API integration
- MCP server configuration remains for development use with Claude Code
- API routes and server actions structured to support direct Dataverse calls

### Next Steps
- Implement Dataverse Web API authentication
- Replace placeholder code with actual Dataverse API calls
- Maintain MCP configuration for Claude Code development workflow
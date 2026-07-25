---
description: R-Tech Gear development philosophy.
---

You are working on the R-Tech Gear project.

This project is developed incrementally.

Always assume:

- Existing code has already been reviewed.
- Existing code should be preserved whenever possible.
- The user prefers small, safe improvements.
- The user values maintainability over clever code.
- The user prefers reusable solutions.

Workflow:

1. Understand the request.
2. Read only relevant files.
3. Find the root cause.
4. Produce the smallest safe patch.
5. Explain what changed.
6. Suggest one optional improvement only if it is directly related.

Never:

- Rewrite entire files.
- Rename IDs or classes without permission.
- Introduce frameworks.
- Break responsiveness.
- Modify unrelated files.
- Add dependencies for simple tasks.

When unsure, ask one clear question before making changes.

Think like a senior engineer reviewing production code.

## Read Before Editing

Always inspect the current implementation before proposing changes.

Never assume:

- CSS values
- HTML structure
- JavaScript logic
- Function names
- Class names

Base every modification on the actual code.

Small verified patches are always preferred over guessed solutions.

If uncertain, ask one question before editing.

# R-TECH GEAR PROJECT MAP

R-TECH GEAR PROJECT MAP

HEADER  
\---------  
header.html  
header.css

HOME PAGE  
\---------  
index.html  
styles.css

SEARCH  
\---------  
shop.html  
products.js

CART  
\---------  
cart.js  
cart.html

CHECKOUT  
\---------  
checkout.html  
first-pass.js

TRACK  
\---------  
track.html  
first-pass.js

PRODUCTS  
\---------  
products.js  
shop.html

HERO  
\---------  
index.html  
styles.css

CATEGORY SYSTEM  
\---------  
index.html  
styles.css  
products.js  
shop.html

# PATCH MODE (Highest Priority)

---

# **PATCH MODE (Highest Priority)**

This project is developed in **incremental sprint patches**.

Unless I explicitly say otherwise:

* NEVER regenerate an entire file.  
* NEVER rewrite existing code outside the requested scope.  
* NEVER output full HTML/CSS/JS files.

Instead always use:

SEARCH

followed by

REPLACE

using the **smallest possible patch**.

If multiple patches are required:

Patch 1

Patch 2

Patch 3

Never merge unrelated fixes together.

---

# **FILE DISCIPLINE**

Only modify the files listed in the sprint.

If another file is required:

STOP.

Explain:

Additional file required:  
filename.ext

Reason:  
...

Wait for approval.

---

# **SEARCH SAFETY**

If the SEARCH block cannot be found exactly:

STOP.

Do NOT guess.

Do NOT rewrite the file.

Tell me:

SEARCH block not found.

Possible reasons:

• file changed  
• different version  
• already patched  
---

# **TOKEN EFFICIENCY**

Use the smallest response possible.

Never repeat code already shown.

Never explain basic HTML/CSS unless requested.

Spend tokens writing code instead of writing essays.

---

# **OUTPUT ORDER**

Always respond in this exact order:

Problems Found

Files to Modify

SEARCH

REPLACE

Testing Checklist

Do not include anything else unless I ask.

---

# **NO ARCHITECTURE CHANGES**

Unless the sprint explicitly asks for it:

Do NOT

* rename classes  
* rename IDs  
* move sections  
* refactor files  
* create components  
* reorganize folders  
* improve unrelated code

Stay inside the requested sprint.

---

# **BEGINNER COMMENTS**

Every new block added should contain comments like:

/\* \=====================================  
  MOBILE SEARCH IMPROVEMENT  
  Sprint 3.2  
  Edit here to change ...  
\===================================== \*/

Future developers must immediately understand what the block does.

---

# **PRESERVE PROJECT STYLE**

Match the existing code style.

Do not introduce a new naming convention.

Reuse existing variables.

Reuse existing spacing.

Reuse existing comments.

Keep the project visually consistent.


---
name: boxing-rules
description: >
  Use this skill to answer any questions about boxing rules, regulations, equipment,
  weight categories, bout procedures, scoring, fouls, knockdowns, officials, or any
  other boxing competition topic. This skill must be used whenever the user asks
  about boxing rules, regulations, or competition procedures — including questions
  about Canadian boxing rules, World Boxing rules, referee decisions, weight limits,
  bout format, equipment requirements, or anything related to how amateur boxing
  competitions are governed or conducted. Always use this skill even for short or
  simple boxing rule questions.
---

# Boxing Rules Skill

This skill answers questions using two official rule sets, consulted in order:

1. **World Boxing Competition Rules** (February 2024)  
   Source: https://worldboxing.org/wp-content/uploads/2024/09/World-Boxing-Competition-Rules-Feb-2024-v3.99-ClEAN.pdf

2. **Boxing Canada Articles and Rules** (January 2025)  
   Source: https://boxingcanada.org/wp-content/uploads/2025/04/Articles-and-Rules-January-2025.pdf

---

## How to Answer

### Step 1 – Search World Boxing Rules first
Consult the World Boxing rules content in `references/world-boxing-rules.md`. Find all relevant articles that relate to the user's question.

### Step 2 – Search Boxing Canada Rules second
Consult the Boxing Canada rules content in `references/boxing-canada-rules.md`. Note any differences, additions, or Canadian-specific modifications.

### Step 3 – Compose the answer

- Lead with the World Boxing answer, then add the Boxing Canada angle.
- **Always cite sources** using this format at the end of every relevant statement:  
  `[World Boxing – Rule X.X.X]` or `[Boxing Canada – Rule X.X.X]`
- If the two rule sets differ on a point, clearly flag it:  
  > ⚠️ **Difference:** Boxing Canada modifies this rule as follows...
- If only one rule set addresses the topic, say so.
- If neither rule set covers it, say so clearly.

### Citation format examples
- `[World Boxing – Rule 8.6.2]`
- `[Boxing Canada – Rule 3.1.1]`
- `[Boxing Canada – Article 1.3.1]`

---

## Reference Files

Read these files when answering questions:

- `references/world-boxing-rules.md` — Full text of World Boxing Competition Rules
- `references/boxing-canada-rules.md` — Full text of Boxing Canada Articles and Rules

Both files are structured with rule numbers matching the official documents, so article citations will be accurate.

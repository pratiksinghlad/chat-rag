Semantic search is an advanced information retrieval technique that understands the meaning, context, and intent behind a user's query, rather than just matching keywords.

# Embedding Similarity & Semantic Search

This document explains why you might see similarity scores around **0.65 – 0.70** even when a keyword like "React" exists in the document, and why this is actually expected behavior for vector embeddings.

## 1. Keywords vs. Semantics

Traditional search (like SQL `LIKE` or Ctrl+F) looks for **exact characters**.
Vector embeddings represent the **meaning (semantics)** of the text in a 3,072-dimensional space.

- **Query: "React"**
  - This vector represents the broad, abstract concept of "React".
- **Document: "React is a JavaScript library for building user interfaces..."**
  - This vector represents a specific definition and technical details.

Because the document is much more specific and contains many other concepts (JavaScript, Meta, hooks, etc.), its "semantic center" is slightly different from the generic word "React". In a 3,072-dimensional space, an angle of 0.68 is actually a **very strong match**.

## 2. Cosine Similarity Scaling

Cosine similarity ranges from `-1.0` (opposites) to `1.0` (identical).

| Score           | Quality        | Meaning                                                             |
| :-------------- | :------------- | :------------------------------------------------------------------ |
| **0.90 – 1.00** | Near Identical | Almost exact same text or extremely high overlap.                   |
| **0.75 – 0.89** | Very Strong    | Highly relevant, usually similar sentence structure.                |
| **0.60 – 0.74** | Strong Match   | **Semantic match** (e.g., your "React" tests). Very useful for RAG. |
| **0.40 – 0.59** | Broad Match    | Related topic but different focus.                                  |
| **Below 0.30**  | Irrelevant     | Mostly noise or very weak connection.                               |

## 3. High-Dimensionality Behavior (3072 dims)

As you increase dimensions (from 768 to 3072), the mathematical space becomes "sparser." Vectors are rarely "perfectly" aligned unless the text is nearly identical.
Scores in the **0.65 – 0.75** range are common for high-fidelity models like `gemini-embedding-001` when performing natural language queries.

## 4. Recommended Thresholds

If you want to filter out bad results but keep the "React" and "Gemini" matches, we recommend setting your `MATCH_THRESHOLD` in `src/types/chat.ts` to:

- **0.50**: Safe starting point for production.
- **0.60**: Strict, high-precision results only.

## 5. Summary: Why only 0.68?

When you search for "React", the model is asking: _"How similar is the abstract idea of 'React' to this specific descriptive paragraph?"_
The answer is **"Very similar (~0.68)"**, but not **"Identical (1.0)"**.

If you searched for the exact sentence: _"React is a JavaScript library..."_, you would see a score closer to **0.95+**.

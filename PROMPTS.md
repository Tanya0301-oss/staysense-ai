# Prompt Engineering Log

During the development of the **StaySense AI** review intelligence pipeline, we observed that guest feedback is highly subjective, unstructured, and vocabulary-rich. To build an enterprise-grade backend that consistently parses sentiment, classifies operational themes, scores urgency, and generates appropriate management replies, our underlying model (**Llama 3.3 70B** hosted on the **Groq API**) required highly optimized and defensive prompting techniques. 

A single, naive prompt was insufficient. Without explicit guardrails, the model exhibited high variance—occasionally failing to output valid JSON, inventing new theme labels, or drafting replies that sounded robotic and generic. This log documents the progression of our prompt design through three major iterations, culminating in the production prompt used by StaySense AI today.

---

## Prompt Version 1

### Purpose
Our initial goal was simple: evaluate how effectively Llama 3.3 70B could classify reviews and draft basic draft replies under zero-shot conditions, using a standard instruction-style prompt.

### Actual Prompt
```text
Analyze the guest review below. 
1. Determine if the sentiment is positive, neutral, or negative.
2. Classify the main issue or subject (such as food, service, location, or host).
3. Write a brief reply that the manager can send to the guest.

Review:
"${reviewText}"
```

### Example Input
```text
We had an okay stay. The location was perfect, right in the center of town. However, the bathroom was not clean when we checked in, and when I told the host, they took over three hours to send a cleaner. Also, the breakfast was cold.
```

### Example Output
```text
Here is the analysis of the review:

1. Sentiment: Negative / Mixed.
2. Subject: Cleanliness and Host Service.
3. Manager Reply: Dear Guest, thank you for staying with us. We are sorry to hear that the bathroom was not clean upon arrival and that it took three hours to send a cleaner. We also regret that your breakfast was cold. We will work hard to fix these issues. Best regards, Management.
```

### Observations
> [!WARNING]
> **Key Issues Identified in Prompt Version 1:**
> *   **Lack of Deterministic Output:** The model returned a conversational preamble (`Here is the analysis...`) rather than a raw, parsable payload. This crashed our Node.js parser when attempting to ingest the result into MongoDB.
> *   **Inconsistent Theme Classification:** Llama did not restrict itself to our database's allowed enums. It generated compound subjects like `"Cleanliness and Host Service"`, which broke frontend filters expecting a single theme (`Cleanliness` or `Host`).
> *   **Lack of Hospitality Context:** The drafted manager reply was a robotic parroting of the guest's complaints. Repeating *"your breakfast was cold"* in the reply can worsen guest frustration; a professional response should offer solutions, not repeat negative details.
> *   **Length Volatility:** The management replies varied wildly in length, occasionally returning paragraphs that were too long for the dashboard UI.

---

## Prompt Version 2

### Purpose
To resolve formatting and enum discrepancies, Version 2 introduced a structured JSON output schema, assigned a basic hospitality role to the model, and requested a numeric confidence score to help flag edge cases.

### Actual Prompt
```text
You are a hospitality assistant helping a hotel manager. 
Analyze the guest review and return a JSON object with the following fields:
- "sentiment": must be one of [Positive, Neutral, Negative]
- "theme": must be one of [Food, Host, Location, Cleanliness, Value, Experience]
- "response": a professional draft reply from the property management acknowledging the guest's feedback
- "priority_score": an integer representing how urgent this review is for the manager (from 1 to 10)

Output ONLY a valid JSON object. Do not include any explanation or markdown code blocks.

Review:
"${reviewText}"
```

### Example Input
```text
The view was stunning and the cabin was decent. But we were billed twice for parking, and no one responded to my emails about getting a refund. Pretty disappointing service.
```

### Example Output
```json
{
  "sentiment": "Negative",
  "theme": "Value",
  "response": "Dear Guest, thank you for sharing your feedback. We sincerely apologize for the double-billing issue on your parking and the delay in responding to your emails. We are investigating this with our accounts team and will contact you directly to resolve the refund. We appreciate your patience.",
  "priority_score": 8
}
```

### Observations
> [!NOTE]
> **Improvements & New Bottlenecks in Prompt Version 2:**
> *   **Improved Schema Adherence:** Forcing JSON made database serialization significantly easier, though Llama still occasionally wrapped outputs in markdown code blocks (\`\`\`json ... \`\`\`), which required custom regex sanitization on our Express backend.
> *   **Erratic Priority Scoring:** Without explicit criteria, the `priority_score` was highly subjective. A minor billing query received an `8/10`, while other reviews mentioning safety issues or broken air conditioning were scored as a `4` or `5`. 
> *   **Repetitive and Verbose Drafts:** The draft replies were overly verbose. They leaned heavily on generic corporate phrases (*"sincerely apologize," "investigating this with our accounts team"*), which felt impersonal for boutique homestays.

---

## Prompt Version 3 (Production Prompt)

### Purpose
Our production prompt establishes a formal system persona: **Senior Hospitality Review Intelligence Analyst**. It defines absolute boundaries, mandates strict JSON output (without markdown wrappers), enforces specific categorization rules, and anchors scores (Priority, Risk) to a logical rubric.

### Complete Production Prompt

```text
SYSTEM ROLE:
You are a Senior Hospitality Review Intelligence Analyst helping hotel and homestay managers understand guest feedback. Your responses must be objective, structured, concise, and actionable.

TASK:
Analyze the guest review provided in the user prompt and extract key metadata. You must return ONLY a JSON object conforming strictly to the output schema. Do NOT wrap the JSON in markdown code blocks (e.g., do not use ```json), do not include any preamble, and do not write any trailing notes.

OUTPUT SCHEMA:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "theme": "Food" | "Host" | "Location" | "Cleanliness" | "Value" | "Experience",
  "priority": 1 | 2 | 3 | 4 | 5,
  "risk_score": 1 | 2 | 3 | 4 | 5,
  "response": "string",
  "review_cluster": "string"
}

SCORING RULES & RUBRICS:

1. sentiment:
   - "Positive": Guest is overwhelmingly satisfied (majority of comments are compliments).
   - "Neutral": Mixed review with equal pros/cons, or flat/indifferent statements.
   - "Negative": Contains explicit complaints, disappointment, or unresolved issues.

2. theme:
   - Map to the SINGLE most critical area mentioned in the review.
   - Priority hierarchy if multiple themes are present: Cleanliness > Host > Value > Food > Location > Experience.
   - E.g., if a review mentions cold food and a dirty bathroom, map to "Cleanliness".

3. priority (1 to 5):
   - 5 (Critical): Safety hazards, security breaches, severe hygiene alerts, or legal threats.
   - 4 (High): Active billing disputes, host/staff rudeness, or total failure of core amenities (no hot water, no heating/AC).
   - 3 (Medium): Minor amenity failures (slow Wi-Fi, television not working, cold breakfast).
   - 2 (Low): Minor design complaints, subjective preferences, or neutral feedback.
   - 1 (Minimal): Exclusively positive feedback or general thank-you notes.

4. risk_score (1 to 5):
   - 5: High risk of immediate negative public reviews, chargebacks, or health inspection issues (food poisoning, bedbugs).
   - 3-4: Risk of customer churn, moderate refund demands, or public complaints about staff behavior.
   - 1-2: Low risk, high chance of return visit.

5. response:
   - Generate a professional, warm, and highly personalized management draft response.
   - Maximum length: TWO sentences.
   - If sentiment is Negative, offer a concrete path to resolution (e.g., direct contact details or refund offer). Do NOT repeat the exact text of the guest's complaint.
   - If sentiment is Positive, express genuine gratitude and invite them back.

6. review_cluster:
   - A short, 2-3 word semantic category summarizing the primary feedback (e.g., "Dirty Bathroom", "Excellent Location", "Billing Dispute", "No AC", "Friendly Host").

USER PROMPT:
Review: "${reviewText}"
```

### Example Input
```text
The garden was beautiful and the bed was very comfortable. However, we found several cockroaches in the kitchen area on our second night, and when I called the front desk, the receptionist was incredibly dismissive and told us to just spray them ourselves. We checked out a day early because of this.
```

### Example Output
```json
{
  "sentiment": "Negative",
  "theme": "Cleanliness",
  "priority": 5,
  "risk_score": 5,
  "response": "We are deeply sorry for the cleanliness issue you encountered and the unprofessional response from our staff. Please contact our general manager directly at management@staysense.ai so we can arrange a full refund for your stay and address this internally.",
  "review_cluster": "Kitchen Cockroaches"
}
```

---

## Final Prompt Selection

We selected **Prompt Version 3** for production because it successfully bridged the gap between LLM creativity and backend engineering requirements. In early testing, developers were frequently debugging parsing failures caused by the model wrapping JSON responses in markdown backticks or adding conversational preambles. Version 3 resolved this by replacing loose formatting instructions with a strict "ONLY JSON, no wrappers" directive, which immediately dropped JSON serialization errors in our Express application to near zero.

Additionally, the introduction of explicit rubrics for scoring significantly stabilized our dashboard analytics. In Version 2, rating priority was highly volatile, making historical trends and automated alerts unreliable. Version 3 anchors priority and risk scoring to concrete operational outcomes (such as safety hazards, billing issues, or simple amenities). Consequently, the Llama 3.3 70B model began producing repeatable, logically sound priority weights, enabling StaySense AI to trust its automated alarm triggers.

Finally, the quality of the generated management responses improved dramatically. By restricting the output to a maximum of two sentences and banning the literal repetition of guest complaints, we eliminated the defensive, robotic tone observed in earlier iterations. The resulting drafts are concise, action-oriented, and maintain a warm hospitality brand voice. This directly improves the user experience for homestay managers, who can now copy-paste drafts directly into booking platforms with minimal editing.

---

## System Role Used

The production prompt leverages a highly specified system role:

> "You are a Senior Hospitality Review Intelligence Analyst helping hotel and homestay managers understand guest feedback. Your responses must be objective, structured, concise, and actionable."

### Why This Role Improved Response Quality:
1. **Contextual Anchoring:** Instructing the model to act as a "Senior Hospitality Review Intelligence Analyst" forces Llama 3.3 70B to adopt a professional, analytical perspective. Rather than simulating a customer service bot or a generic assistant, the model evaluates reviews through the lens of business risk, operational efficiency, and guest relations.
2. **Constrained Response Generation:** The words *objective* and *concise* act as powerful prompt modifiers. They discourage the model from generating flowery, overly apologetic, or redundant text, keeping the draft replies short and appropriate for professional correspondence.
3. **Action-Oriented Outputs:** The instruction to be *actionable* shifts how the model handles negative reviews. Instead of simply acknowledging a mistake, the model proactively suggests a resolution strategy (such as direct escalations or refunds) when generating the management response.

---

## Lessons Learned

Throughout the design and testing phases of the StaySense AI review pipeline, our engineering team gathered several key learnings:

| # | Lesson Learned | Engineering Impact |
| :--- | :--- | :--- |
| **1** | **Minor wording changes dictate parsing reliability.** | Explicitly banning markdown fences (` ```json `) in the system role is far more effective than trying to sanitize complex string outputs downstream in the Node.js API layer. |
| **2** | **Rubrics are mandatory for consistent scoring.** | LLMs do not share a human baseline for urgency. Without an anchored scale (1–5 rubric with examples), priority scores drift based on the length or emotional intensity of the review. |
| **3** | **Persona definitions enforce domain constraints.** | Defining a professional persona (e.g., "Senior Hospitality Analyst") naturally filters out irrelevant commentary, aligns tone, and reduces the need for long lists of negative constraints. |
| **4** | **Shorter prompts are not always better.** | A prompt with detailed definitions, hierarchy guides, and rubrics performs significantly more consistently under high concurrent load than a short, vague instruction. |
| **5** | **Separating system rules from user input prevents injection.** | Keeping structural rules in the system prompt and review content isolated in the user prompt protects the classification pipeline from guest reviews that attempt to trick the AI (e.g., reviews containing "Ignore previous instructions..."). |
| **6** | **Enums prevent label hallucination.** | Explicitly listing allowed strings for sentiment and themes within the JSON instructions prevents the model from generating synonym tags that would break database queries. |
| **7** | **Restricting draft responses improves readability.** | Setting a hard limit of two sentences forces the model to generate high-density, polite replies rather than long, boilerplate apologies that managers routinely reject. |

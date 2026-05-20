# Data Annotation Tool

**Dataset labelling platform for preparing structured training data for AI models.**

The Data Annotation Tool is a portfolio project designed to support human-in-the-loop AI training workflows. It allows reviewers to label raw text data, classify support messages, assign categories, add confidence scores, write reviewer notes, and export structured labelled datasets.

This project focuses on dataset preparation, annotation quality, and human review — the type of workflow used before AI models are trained, fine-tuned, or evaluated.

---

## Project Overview

AI systems depend on high-quality labelled data. Before a model can learn to classify text, detect intent, understand sentiment, or respond accurately to customer queries, raw data often needs to be reviewed and labelled by humans.

This project simulates that process.

The app provides a simple annotation dashboard where reviewers can work through a queue of sample data, apply labels, add notes, track review progress, and export completed annotations.

Unlike an LLM evaluation platform, which focuses on testing model outputs, this tool focuses on preparing and labelling the training data that AI systems learn from.

---

## Problem It Solves

AI teams often need structured labelled datasets for:

- Text classification
- Sentiment analysis
- Intent detection
- Customer support automation
- Content moderation
- Chatbot training
- Model fine-tuning
- Dataset quality review

Raw data is usually messy, inconsistent, and unstructured. Human reviewers help turn that data into reliable training examples.

This tool demonstrates how an annotation workflow can improve dataset quality by adding:

- Clear category labels
- Confidence scores
- Reviewer notes
- Annotation status tracking
- Human review checkpoints
- Exportable structured data

---

## Key Features

### Annotation Dashboard

The dashboard gives reviewers a quick overview of annotation progress.

Example metrics include:

- Total records
- Pending annotations
- Completed annotations
- In-review items
- Low-confidence items
- Label distribution
- Recent annotation activity

---

### Annotation Queue

Reviewers can work through a queue of sample records that need labelling.

Each item may include:

- Record ID
- Text sample
- Source type
- Suggested category
- Current status
- Assigned reviewer
- Last updated date

The queue helps simulate how annotation teams manage large datasets before they are used in AI training.

---

### Text Classification

Reviewers can assign labels to text records.

Example labels include:

- Billing issue
- Technical support
- Account access
- Product question
- Complaint
- Refund request
- Sales enquiry
- General feedback

This demonstrates classification workflows used in AI training and customer support automation.

---

### Sentiment Labelling

The tool can be used to label the emotional tone of text data.

Example sentiment labels include:

- Positive
- Neutral
- Negative
- Frustrated
- Confused
- Urgent

Sentiment labels are useful for training AI models that need to detect customer mood or prioritise support cases.

---

### Intent Labelling

Reviewers can label what the user is trying to achieve.

Example intent labels include:

- Request information
- Report a problem
- Ask for refund
- Cancel service
- Update account
- Escalate issue
- Make a complaint
- Ask for human support

Intent data can be used to train chatbots, routing systems, and AI support assistants.

---

### Reviewer Notes

Each annotation can include written notes explaining the reviewer’s decision.

Reviewer notes help improve annotation quality by capturing:

- Why a label was selected
- Any ambiguity in the text
- Potential edge cases
- Suggested review actions
- Context for future model training

---

### Confidence Scoring

Reviewers can assign a confidence level to each annotation.

Example confidence levels:

- Low
- Medium
- High

Low-confidence annotations can be flagged for second review before being included in a training dataset.

---

### Review Status Tracking

Each record can move through a simple review workflow.

Example statuses:

- Pending
- In progress
- Reviewed
- Needs second review
- Approved
- Rejected

This demonstrates how annotation quality control can be managed in human-in-the-loop AI workflows.

---

### Export Labelled Dataset

Completed annotations can be exported as structured data.

Example export fields:

- Record ID
- Original text
- Selected category
- Sentiment label
- Intent label
- Confidence score
- Reviewer notes
- Review status
- Annotated date

This simulates how labelled data could be passed into AI training, model fine-tuning, analytics, or evaluation pipelines.

---

## How This Differs From My LLM Evaluation Platform

This project is separate from my LLM Evaluation Platform.

| Project | Purpose |
|---|---|
| Data Annotation Tool | Labels raw data before it is used for AI training |
| LLM Evaluation Platform | Tests and scores model outputs after an AI model responds |

### Data Annotation Tool

This project answers:

> “How do we prepare clean labelled datasets for AI training?”

It focuses on:

- Dataset preparation
- Text labelling
- Sentiment tagging
- Intent classification
- Reviewer notes
- Confidence scoring
- Exporting labelled training data

### LLM Evaluation Platform

The LLM Evaluation Platform answers:

> “How do we evaluate whether an AI model gave a good answer?”

It focuses on:

- Prompt testing
- Model response comparison
- Hallucination checks
- Safety scoring
- Accuracy scoring
- Human feedback on AI outputs

Together, the two projects show both sides of the AI training lifecycle:

1. Preparing labelled datasets
2. Evaluating model performance

---

## Example Workflow

1. A reviewer opens the annotation queue.
2. They select a pending text record.
3. They read the sample text.
4. They choose a category label.
5. They assign sentiment and intent labels.
6. They add reviewer notes.
7. They choose a confidence level.
8. They mark the record as reviewed.
9. Low-confidence items can be sent for second review.
10. Completed annotations can be exported as JSON or CSV.

---

## Example Data Structure

```json
{
  "recordId": "REC-001",
  "text": "I was charged twice and need help getting a refund.",
  "category": "Billing issue",
  "sentiment": "Negative",
  "intent": "Ask for refund",
  "confidence": "High",
  "reviewerNotes": "Customer is clearly reporting a duplicate charge and requesting a refund.",
  "status": "Reviewed",
  "annotatedAt": "2026-05-19"
}

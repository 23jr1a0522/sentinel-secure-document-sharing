# AI Usage and Prompt Documentation

## 1. Purpose

This document describes how AI assistance was used during the development of Sentinel Secure Document Sharing and how the application's own AI document-question feature is implemented.

AI assistance was used during development for code generation, debugging, documentation, security review and implementation guidance.

All generated code was reviewed and modified before being used in the project.

## 2. AI Assistance Used During Development

AI assistance was used for:

- Initial project structure and implementation guidance
- Backend and frontend code generation
- Debugging TypeScript and runtime errors
- Prisma and database troubleshooting
- Authentication and authorization review
- Security and threat-model documentation
- API documentation
- Deployment troubleshooting
- AI document-question feature implementation
- README and project documentation
- Test-case and demo planning

AI-generated code was not automatically considered secure. The implementation was reviewed and tested before being included in the project.

## 3. Development Review Rules

The following rules were followed while using AI assistance:

1. Review every document operation for authentication.
2. Verify resource-level authorization before accessing documents.
3. Validate user input on sensitive endpoints.
4. Avoid exposing secrets or credentials in source code.
5. Review file-upload restrictions.
6. Review sharing and permission controls.
7. Test security-sensitive behavior instead of assuming that the implementation is secure.
8. Make small changes when debugging and verify the result after each change.
9. Do not describe an untested security control as fully verified.
10. Review generated code before committing it to the repository.

# 4. Sentinel AI Document Question Feature

Sentinel includes an AI feature that allows an authorized user to ask questions about an uploaded document.

### Processing flow

```text
User
  ↓
Select Document
  ↓
Submit Question
  ↓
Authentication Check
  ↓
Document Authorization Check
  ↓
Read Document
  ↓
Extract Document Text
  ↓
Send Relevant Content to Gemini
  ↓
Generate Answer
  ↓
Return Answer to Authorized User
```
The AI feature supports document-based questions for supported document formats implemented by the application.

# 5. AI Authorization

The AI endpoint does not provide an alternative way to bypass Sentinel's document permissions.

Before processing a document, the backend verifies that the authenticated user has permission to access that document.

This is important because an AI endpoint must not allow a user to ask questions about documents that the user could not otherwise access.

The authorization flow is:

```text
Authenticated User
       ↓
Document ID
       ↓
Authorization Check
       ↓
Authorized?
    /       \
  Yes        No
   ↓          ↓
Read File   Reject
   ↓
AI Processing
```

# 6. AI Prompting

The AI request is designed to answer questions using the content of the authorized document.

A simplified prompt structure is:

```text
You are a document question-answering assistant.

Use the provided document content to answer the user's question.

Document:
[EXTRACTED DOCUMENT CONTENT]

Question:
[USER QUESTION]

Answer the question using the available document information.
If the answer cannot be determined from the document, clearly state
that the information is not available.
```

The exact implementation prompt may be adjusted as the application evolves.

# 7. AI Security Considerations

The AI feature introduces additional security considerations.

## Unauthorized AI Access

Threat:

A user attempts to use the AI endpoint to access another user's document.

Control:

The backend performs document authorization before reading or processing the document.

## Prompt Injection

Threat:

A document may contain text that attempts to manipulate the AI's behavior.

Control:

Document content is treated as document data rather than as application instructions.

Residual risk:

Prompt injection cannot be completely eliminated with prompting alone. Further production hardening may include stronger content isolation, structured prompts and additional output validation.

## Sensitive Information Leakage

Threat:

The AI could return sensitive information contained in an authorized document.

Control:

AI processing is restricted by the same document authorization boundary used for document access.

Residual risk:

An authorized user may still ask questions about information they are permitted to access. Additional data-classification and response-filtering controls may be required for enterprise deployments.

## Hallucination

Threat:

The AI may generate an incorrect answer that is not supported by the document.

Control:

The AI is instructed to use the supplied document content and indicate when information is unavailable.

Residual risk:

AI-generated answers should not be treated as authoritative without verification against the original document.

## AI API Abuse

Threat:

An attacker repeatedly sends AI requests to consume resources or increase API usage.

Control:

Authentication and backend endpoint protections are applied to sensitive application operations.

Future improvement:

Dedicated AI request limits, usage quotas and monitoring can be added for production deployments.

# 8. Supported Document Processing

The backend processes supported document formats before sending their text to the AI service.

The current implementation includes processing for:

- PDF
- DOCX
- TXT

The extracted text is used as the context for the AI question-answering request.

# 9. Error Handling

The application handles failures that can occur during AI processing, including:

- Missing AI API configuration
- Unauthorized document access
- Missing document files
- Unsupported document formats
- Document text extraction failures
- AI API errors
- Invalid user requests

The application should return a controlled error instead of exposing internal secrets, stack traces or sensitive implementation details to the user.

# 10. AI Development Verification

The AI feature was reviewed during development using the following checks:

| Check | Purpose | Status |
|---|---|---|
| AI endpoint reachable | Verify backend AI route | Tested |
| Authentication | Ensure user is authenticated | Tested |
| Document authorization | Prevent unauthorized document access | Tested |
| Document reading | Verify backend can access stored document | Tested during local/deployment debugging |
| AI request | Verify Gemini integration | Tested during development |
| Unauthorized document access | Prevent AI authorization bypass | To be included in final security test |
| Invalid document | Verify controlled error | To be included in final test |
| Prompt injection behavior | Review AI response safety | To be included in final test |

Only tests actually performed should be marked as passing in the final submission.

# 11. Deployment Consideration

The deployed application currently uses filesystem-based document storage.

In an ephemeral deployment environment, uploaded files may become unavailable after a restart or redeployment even though the corresponding database record still exists.

This can affect AI document processing because the AI feature requires access to the physical document before extracting its contents.

### Production improvement

A production deployment should use private persistent object storage such as:

- Amazon S3
- S3-compatible object storage
- Another managed private document-storage service

The database should store document metadata and storage identifiers rather than relying on an ephemeral application filesystem.

# 12. AI Limitations

The AI feature has the following limitations:

- AI-generated answers may be incorrect.
- AI responses depend on the quality of extracted document text.
- Very large documents may require additional chunking or retrieval strategies.
- Prompt injection may still be possible through malicious document content.
- AI API availability and rate limits can affect the feature.
- Persistent document storage is required for reliable production deployment.

# 13. Responsible Use

The AI feature is intended to assist users in understanding authorized documents.

It should not be treated as a replacement for reviewing the original document when accuracy is important.

Users should verify important information against the original document.

# 14. Final Review Principle

AI assistance was used as a development tool, not as a substitute for engineering verification.

Security claims in this project should be supported by:

1. Code review
2. Security testing
3. Functional testing
4. Deployment testing
5. Review of known limitations

The project should only be described as production-ready after the remaining deployment and security limitations have been addressed and verified.

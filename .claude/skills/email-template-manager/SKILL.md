---
skill_name: email-template-manager
applies_to_local_project_only: true
auto_trigger_regex: [create email template, add email template, new email notification, email template]
tags: [email, templates, mail-service, nestjs]
---

# Email Template Manager

Manage and generate email templates following the project's established patterns. Currently, 12+ templates are embedded inline in `backend/src/shared/modules/mail/mail.service.ts` (1,289 lines), plus a scattered template in `backend/src/modules/waitlist/waitlist.service.ts`.

## Usage

```
/email-template-manager {templateName}
```

## Phase 1: Generate New Email Template (Primary Use)

### Interactive Prompts

1. **Template name** (kebab-case, e.g., "payment-confirmation")
2. **Variables needed** (e.g., userName, amount, date, classTitle)
3. **Email subject line**
4. **Call-to-action button?** (text + URL variable)
5. **Content sections** (highlight box, plain text, bullet list, testimonial)

### What Gets Generated

Add two methods to `mail.service.ts` following the existing pattern:

```typescript
// 1. Public send method
async sendPaymentConfirmationEmail(to: string, name: string, amount: number, classTitle: string): Promise<void> {
    const html = this.getPaymentConfirmationEmailTemplate(name, amount, classTitle);
    await this.sendEmail(to, 'Payment Confirmed - KTalk Live', html);
}

// 2. Private template method (inline HTML following existing CSS patterns)
private getPaymentConfirmationEmailTemplate(name: string, amount: number, classTitle: string): string {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            /* ... shared CSS from existing templates ... */
        </style>
    </head>
    <body>
        <!-- Template content with variables -->
    </body>
    </html>`;
}
```

### Required CSS Elements (Copy from Existing Templates)

All templates MUST use these shared styles for brand consistency:
- `.email-container` - max-width: 600px, white background, border-radius: 8px
- `.header` - Background gradient or solid color with logo
- `.button` - display: inline-block, padding: 14px 32px, border-radius: 8px, font-weight: bold
- `.footer` - Gray background, small text, copyright

Reference: `mail.service.ts` line 125 (`getTrialFollowUpEmailTemplate`) for the canonical template structure.

### Email Tracking Integration

If the email should be tracked for idempotency (e.g., sent-once sequences):

1. Add a nullable `timestamptz` column to the relevant entity:
   ```typescript
   @Column({ type: 'timestamptz', nullable: true })
   paymentConfirmationEmailSentAt: Date;
   ```

2. Create a migration for the new column

3. Set the timestamp after successful send:
   ```typescript
   await this.calendlyRepository.update(id, { paymentConfirmationEmailSentAt: new Date() });
   ```

4. If part of a sequence, add a cron job that queries:
   ```typescript
   .where('entity.previousStepSentAt IS NOT NULL')
   .andWhere('entity.paymentConfirmationEmailSentAt IS NULL')
   .andWhere('entity.previousStepSentAt < :cutoff', { cutoff })
   ```

## Phase 2: Refactoring (Future Enhancement)

When mail.service.ts exceeds ~1,500 lines, consider extracting templates:

```
backend/src/shared/modules/mail/
  mail.service.ts              - Send methods only (~300 lines)
  templates/
    base.template.ts           - Shared HTML wrapper, CSS, header/footer
    components.ts              - Reusable: button(), highlightBox(), section()
    trial-follow-up.ts
    trial-prep.ts
    nurture-sequence.ts        - All 4 nurture emails
    recovery.ts                - No-show + cancellation
    onboarding.ts              - Welcome + credentials + profile
    waitlist-notification.ts   - Move from waitlist.service.ts
```

## Conventions

- Template method names: `get{PascalCase}EmailTemplate`
- Send method names: `send{PascalCase}Email`
- All inline HTML (no external template engine)
- Always include mobile-responsive meta viewport
- Always include plain-text fallback consideration
- Button colors: Primary `#4CAF50` (green) for positive actions, `#007BFF` (blue) for informational
- Footer must include: Copyright, company name, "You received this email because..."

## Related Files

- `backend/src/shared/modules/mail/mail.service.ts` - All current templates
- `backend/src/modules/waitlist/waitlist.service.ts` (lines 346-400) - Scattered template
- `backend/src/modules/calendly/calendly.entity.ts` - Email tracking columns
- `backend/src/modules/application/application.entity.ts` - Email tracking columns

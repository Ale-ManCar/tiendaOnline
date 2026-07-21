import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASSWORD');
    const port = Number(config.get<string>('SMTP_PORT', '587'));
    const secure = config.get<string>('SMTP_SECURE', 'false') === 'true';
    this.from = config.get<string>('SMTP_FROM', user ?? 'no-reply@novastore.local');

    this.transporter =
      host && user && pass
        ? nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
          })
        : null;
  }

  get isConfigured() {
    return Boolean(this.transporter);
  }

  async send(payload: MailPayload) {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP is not configured. Email to ${payload.to} was not sent. Subject: ${payload.subject}`,
      );
      this.logger.debug(payload.text);
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }
}

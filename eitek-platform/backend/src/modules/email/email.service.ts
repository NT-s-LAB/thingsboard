import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export type EmailProvider = 'smtp' | 'resend';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

export interface ResendConfig {
  apiKey: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

export interface EmailConfig {
  provider: EmailProvider;
  smtp: SmtpConfig;
  resend: ResendConfig;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly settingsService: AdminSettingsService) {}

  /**
   * Load full email configuration from system settings
   */
  async getEmailConfig(): Promise<EmailConfig> {
    const [provider, host, port, username, password, secure, resendApiKey, fromName, fromEmail, enabled] =
      await Promise.all([
        this.settingsService.getSettingValue<string>('email.provider'),
        this.settingsService.getSettingValue<string>('email.smtpHost'),
        this.settingsService.getSettingValue<number>('email.smtpPort'),
        this.settingsService.getSettingValue<string>('email.smtpUsername'),
        this.settingsService.getSettingValue<string>('email.smtpPassword'),
        this.settingsService.getSettingValue<boolean>('email.smtpSecure'),
        this.settingsService.getSettingValue<string>('email.resendApiKey'),
        this.settingsService.getSettingValue<string>('email.fromName'),
        this.settingsService.getSettingValue<string>('email.fromEmail'),
        this.settingsService.getSettingValue<boolean>('email.enabled'),
      ]);

    return {
      provider: (provider as EmailProvider) || 'smtp',
      smtp: {
        host: host || 'smtp.gmail.com',
        port: port || 587,
        secure: secure ?? true,
        username: username || '',
        password: password || '',
        fromName: fromName || 'EITEK Platform',
        fromEmail: fromEmail || 'noreply@eitek.com',
        enabled: enabled ?? false,
      },
      resend: {
        apiKey: resendApiKey || '',
        fromName: fromName || 'EITEK Platform',
        fromEmail: fromEmail || 'noreply@eitek.com',
        enabled: enabled ?? false,
      },
    };
  }

  /**
   * Legacy getter for backward compatibility
   */
  async getSmtpConfig(): Promise<SmtpConfig> {
    const config = await this.getEmailConfig();
    return config.smtp;
  }

  /**
   * Create a nodemailer transporter from SMTP config
   */
  private createTransporter(config: SmtpConfig): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.username,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Send an email using the configured provider
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.getEmailConfig();

      if (!config.smtp.enabled) {
        return { success: false, error: 'Email service is disabled' };
      }

      if (config.provider === 'resend') {
        return this.sendViaResend(config.resend, options);
      }
      return this.sendViaSmtp(config.smtp, options);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendViaSmtp(config: SmtpConfig, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!config.host || !config.username || !config.password) {
      return { success: false, error: 'SMTP configuration incomplete' };
    }

    const transporter = this.createTransporter(config);
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      ...(options.text ? { text: options.text } : {}),
      ...(options.html ? { html: options.html } : {}),
    });

    this.logger.log(`Email sent via SMTP: ${info.messageId} to ${options.to}`);
    return { success: true, messageId: info.messageId };
  }

  private async sendViaResend(config: ResendConfig, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!config.apiKey) {
      return { success: false, error: 'Resend API Key is required' };
    }

    const resend = new Resend(config.apiKey);
    const { data, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html || options.text || '',
    });

    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      return { success: false, error: error.message };
    }

    this.logger.log(`Email sent via Resend: ${data?.id} to ${options.to}`);
    return { success: true, messageId: data?.id };
  }

  // ── Test methods ─────────────────────────────────────────────────────────

  /**
   * Test with a specific SMTP config (from form)
   */
  async testWithConfig(config: SmtpConfig, testRecipient?: string): Promise<{ success: boolean; message: string }> {
    return this._doSmtpTest(config, testRecipient);
  }

  /**
   * Test with a specific Resend config (from form)
   */
  async testResendWithConfig(config: ResendConfig, testRecipient?: string): Promise<{ success: boolean; message: string }> {
    return this._doResendTest(config, testRecipient);
  }

  /**
   * Verify connection and send a test email (reads config from DB)
   */
  async testConnection(testRecipient?: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getEmailConfig();
    if (config.provider === 'resend') {
      return this._doResendTest(config.resend, testRecipient);
    }
    return this._doSmtpTest(config.smtp, testRecipient);
  }

  private buildTestEmailHtml(providerLabel: string, details: Record<string, string>): string {
    const rows = Object.entries(details)
      .map(([k, v]) => `<tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">${k}:</td><td>${v}</td></tr>`)
      .join('');
    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e3a5f;">&#10003; Kết nối ${providerLabel} thành công!</h2>
        <p>Email này xác nhận cấu hình ${providerLabel} của bạn hoạt động chính xác.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <table style="font-size: 13px; color: #475569;">${rows}</table>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Gửi bởi EITEK IoT Platform</p>
      </div>
    `;
  }

  private async _doSmtpTest(config: SmtpConfig, testRecipient?: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.host || !config.username || !config.password) {
        return { success: false, message: 'Cấu hình SMTP chưa đầy đủ. Vui lòng điền SMTP Host, Username và Password.' };
      }

      const transporter = this.createTransporter(config);
      await transporter.verify();

      if (testRecipient) {
        await transporter.sendMail({
          from: `"${config.fromName}" <${config.fromEmail}>`,
          to: testRecipient,
          subject: '🔧 EITEK Platform - Test Email (SMTP)',
          html: this.buildTestEmailHtml('SMTP', {
            Host: config.host,
            Port: String(config.port),
            From: `${config.fromName} &lt;${config.fromEmail}&gt;`,
          }),
        });
        return { success: true, message: `Kết nối SMTP thành công! Email kiểm tra đã gửi đến ${testRecipient}` };
      }

      return { success: true, message: `Kết nối SMTP đến ${config.host}:${config.port} thành công!` };
    } catch (error) {
      this.logger.error(`SMTP test failed: ${error.message}`);
      let message = error.message;
      if (error.code === 'ECONNREFUSED') {
        message = `Không thể kết nối đến ${config.host}. Kiểm tra host và port.`;
      } else if (error.code === 'EAUTH') {
        message = 'Xác thực thất bại. Kiểm tra username/password. Nếu dùng Gmail, hãy dùng App Password.';
      } else if (error.code === 'ESOCKET') {
        message = 'Lỗi kết nối. Kiểm tra port và cài đặt TLS/SSL.';
      }
      return { success: false, message };
    }
  }

  private async _doResendTest(config: ResendConfig, testRecipient?: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.apiKey) {
        return { success: false, message: 'Vui lòng nhập Resend API Key.' };
      }

      const resend = new Resend(config.apiKey);

      if (testRecipient) {
        const { error } = await resend.emails.send({
          from: `${config.fromName} <${config.fromEmail}>`,
          to: [testRecipient],
          subject: '🔧 EITEK Platform - Test Email (Resend)',
          html: this.buildTestEmailHtml('Resend', {
            Provider: 'Resend',
            From: `${config.fromName} &lt;${config.fromEmail}&gt;`,
          }),
        });

        if (error) {
          return { success: false, message: `Resend lỗi: ${error.message}` };
        }
        return { success: true, message: `Kết nối Resend thành công! Email kiểm tra đã gửi đến ${testRecipient}` };
      }

      // Without recipient, just verify the API key by listing domains
      const { error } = await resend.domains.list();
      if (error) {
        return { success: false, message: `API Key không hợp lệ: ${error.message}` };
      }
      return { success: true, message: 'Kết nối Resend thành công! API Key hợp lệ.' };
    } catch (error) {
      this.logger.error(`Resend test failed: ${error.message}`);
      return { success: false, message: `Lỗi kết nối Resend: ${error.message}` };
    }
  }
}

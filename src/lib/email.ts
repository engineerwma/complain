// lib/email.ts - Complete fixed version
import { createTransport } from 'nodemailer';
import { emailTemplates } from './email-templates';
import { Complaint, User } from './email-templates'; // Import from email-templates.ts

// Create Gmail transporter with port 587 (more reliable)
function createTransporter() {
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  };

  console.log('📧 Creating email transporter...');
  console.log('Email:', process.env.EMAIL_USER);
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('Secure:', config.secure);

  return createTransport(config);
}

// Test email connection
export async function testEmailConnection() {
  let transporter;
  try {
    console.log('🔄 Testing email connection...');
    
    transporter = createTransporter();
    await transporter.verify();
    
    console.log('✅ Email connection successful');
    return true;
    
  } catch (error: unknown) {
    console.error('❌ Email connection FAILED:');
    
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
    
    return false;
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
}

// Send email function - ADD THIS MISSING FUNCTION
async function sendEmail(to: string | string[], subject: string, html: string, retryCount = 0) {
  const maxRetries = 2;
  let transporter;

  try {
    console.log(`📤 Sending email (Attempt ${retryCount + 1}/${maxRetries + 1})...`);
    console.log('To:', to);
    console.log('Subject:', subject);

    transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Complaint Management System',
        address: process.env.EMAIL_FROM!
      },
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ''),
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    
    return result;

  } catch (error: unknown) {
    console.error(`❌ Email sending failed (Attempt ${retryCount + 1}):`);
    
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('Code:', (error as any).code);
      
      // Retry for connection-related errors
      if (retryCount < maxRetries && (
        (error as any).code === 'ECONNRESET' || 
        (error as any).code === 'ETIMEDOUT' ||
        (error as any).code === 'ESOCKET'
      )) {
        console.log(`🔄 Retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return sendEmail(to, subject, html, retryCount + 1);
      }
    }
    
    throw error;
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
}

// Define interfaces for email parameters
interface ComplaintCreatedEmailParams {
  to: string[];
  complaint: Complaint;
  assignedTo?: User;
}

interface ComplaintAssignmentEmailParams {
  to: string;
  complaint: Complaint;
  assignedTo?: User;
}

interface SLAReminderEmailParams {
  to: string[];
  complaint: Complaint;
  hours: number;
}

interface SLABreachEmailParams {
  to: string;
  userName: string;
  complaintNumber: string;
  customerName: string;
  dueDate: Date;
}

// Email functions
export async function sendComplaintCreatedEmail({
  to,
  complaint,
  assignedTo
}: ComplaintCreatedEmailParams) {
  try {
    const subject = emailTemplates.complaintCreated.subject(complaint.complaintNumber);
    const html = emailTemplates.complaintCreated.body(complaint, assignedTo);
    
    await sendEmail(to, subject, html);
    console.log(`✅ Complaint creation email sent to ${to.length} recipients`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send complaint creation email:', error);
    return false;
  }
}

export async function sendComplaintAssignmentEmail({
  to,
  complaint,
  assignedTo
}: ComplaintAssignmentEmailParams) {
  try {
    const subject = emailTemplates.complaintAssignment.subject(complaint.complaintNumber);
    
    // Use provided assignedTo or create a basic user object from email
    const user = assignedTo || {
      id: '',
      name: to.split('@')[0],
      email: to
    };
    
    const html = emailTemplates.complaintAssignment.body(complaint, user);
    
    await sendEmail(to, subject, html);
    console.log(`✅ Assignment email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send assignment email:', error);
    return false;
  }
}

export async function sendSLAReminderEmail({
  to,
  complaint,
  hours
}: SLAReminderEmailParams) {
  try {
    const subject = emailTemplates.slaReminder.subject(complaint.complaintNumber);
    const html = emailTemplates.slaReminder.body(complaint, hours);
    
    await sendEmail(to, subject, html);
    console.log(`✅ SLA reminder email sent to ${to.length} recipients`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send SLA reminder email:', error);
    return false;
  }
}

export async function sendSLABreachEmail({
  to,
  userName,
  complaintNumber,
  customerName,
  dueDate
}: SLABreachEmailParams) {
  try {
    const subject = `SLA BREACH ALERT - ${complaintNumber}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc2626; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 SLA BREACH ALERT</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p><strong>URGENT:</strong> A complaint has breached its SLA deadline and requires immediate attention.</p>
            
            <div class="details">
              <h3>Complaint Details:</h3>
              <p><strong>Complaint Number:</strong> ${complaintNumber}</p>
              <p><strong>Customer Name:</strong> ${customerName}</p>
              <p><strong>Due Date:</strong> ${dueDate.toLocaleString()}</p>
              <p><strong>Current Status:</strong> BREACHED</p>
            </div>
            
            <p><strong>⚠️ IMMEDIATE ACTION REQUIRED:</strong> Please resolve this complaint immediately and update its status.</p>
          </div>
          <div class="footer">
            <p>This is an automated SLA breach alert from Complaint Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(to, subject, html);
    console.log(`✅ SLA breach email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send SLA breach email:', error);
    return false;
  }
}
// lib/email-templates.ts

export interface Complaint {
  complaintNumber: string;
  customerName: string;
  customerId: string;
  policyNumber: string;
  policyType: string;
  description: string;
  createdAt: string | Date;
  dueDate?: string | Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export const emailTemplates = {
  complaintCreated: {
    subject: (complaintNumber: string) => `New Complaint Created - ${complaintNumber}`,
    body: (complaint: Complaint, assignedTo?: User) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2563eb; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Complaint Created</h1>
          </div>
          <div class="content">
            <p>A new complaint has been created${assignedTo ? ` and assigned to ${assignedTo.name}` : ' and requires assignment'}.</p>
            
            <div class="details">
              <h3>Complaint Details:</h3>
              <p><strong>Complaint Number:</strong> ${complaint.complaintNumber}</p>
              <p><strong>Customer Name:</strong> ${complaint.customerName}</p>
              <p><strong>Customer ID:</strong> ${complaint.customerId}</p>
              <p><strong>Policy Number:</strong> ${complaint.policyNumber}</p>
              <p><strong>Policy Type:</strong> ${complaint.policyType}</p>
              <p><strong>Description:</strong> ${complaint.description}</p>
              <p><strong>Created Date:</strong> ${new Date(complaint.createdAt).toLocaleString()}</p>
              ${complaint.dueDate ? `<p><strong>Due Date:</strong> ${new Date(complaint.dueDate).toLocaleString()}</p>` : ''}
            </div>
            
            <p>Please take appropriate action on this complaint.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Complaint Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  complaintAssignment: {
    subject: (complaintNumber: string) => `Complaint Assigned to You - ${complaintNumber}`,
    body: (complaint: Complaint, assignedTo: User) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #059669; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .urgent { background: #fef3c7; border-left: 4px solid #d97706; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Complaint Assigned to You</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${assignedTo.name}</strong>,</p>
            <p>You have been assigned a new complaint that requires your attention.</p>
            
            <div class="details">
              <h3>Complaint Details:</h3>
              <p><strong>Complaint Number:</strong> ${complaint.complaintNumber}</p>
              <p><strong>Customer Name:</strong> ${complaint.customerName}</p>
              <p><strong>Customer ID:</strong> ${complaint.customerId}</p>
              <p><strong>Policy Number:</strong> ${complaint.policyNumber}</p>
              <p><strong>Policy Type:</strong> ${complaint.policyType}</p>
              <p><strong>Description:</strong> ${complaint.description}</p>
              <p><strong>Due Date:</strong> ${complaint.dueDate ? new Date(complaint.dueDate).toLocaleString() : 'Not set'}</p>
            </div>
            
            <div class="details urgent">
              <h3>⚠️ Action Required</h3>
              <p>Please review this complaint and take necessary action to resolve it within the specified timeframe.</p>
            </div>
            
            <p>Best regards,<br>Complaint Management System</p>
          </div>
          <div class="footer">
            <p>This is an automated assignment notification</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  slaReminder: {
    subject: (complaintNumber: string) => `SLA Reminder - ${complaintNumber}`,
    body: (complaint: Complaint, hours: number) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .details { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeaa7; border-left: 4px solid #dc2626; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SLA Reminder</h1>
          </div>
          <div class="content">
            <p>This is a reminder that the following complaint is still unresolved after <strong>${hours} hour${hours > 1 ? 's' : ''}</strong>.</p>
            
            <div class="details">
              <h3>Complaint Details:</h3>
              <p><strong>Complaint Number:</strong> ${complaint.complaintNumber}</p>
              <p><strong>Customer Name:</strong> ${complaint.customerName}</p>
              <p><strong>Customer ID:</strong> ${complaint.customerId}</p>
              <p><strong>Policy Number:</strong> ${complaint.policyNumber}</p>
              <p><strong>Created Date:</strong> ${new Date(complaint.createdAt).toLocaleString()}</p>
              <p><strong>Time Since Creation:</strong> ${hours} hour${hours > 1 ? 's' : ''}</p>
              ${complaint.dueDate ? `<p><strong>Due Date:</strong> ${new Date(complaint.dueDate).toLocaleString()}</p>` : ''}
            </div>
            
            <p><strong>Please prioritize resolving this complaint to meet SLA requirements.</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated SLA reminder from Complaint Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};
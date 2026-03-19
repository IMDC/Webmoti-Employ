export function getAdminEmails(adminEmailsEnv: string | undefined): string[] {
  return adminEmailsEnv?.split(',').map(e => e.trim().toLowerCase()) ?? []
}

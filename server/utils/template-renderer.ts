/**
 * Template rendering utilities.
 * Pure functions for variable substitution in email templates.
 */

/**
 * Renders a template string by replacing {{variable}} placeholders with values.
 *
 * @param template - The template string with {{variable}} placeholders
 * @param variables - Key-value pairs of variables to substitute
 * @returns The rendered template with variables replaced
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

/**
 * Extracts variable names from a template string.
 *
 * @param template - The template string to extract variables from
 * @returns Array of unique variable names found in the template
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const variables = new Set<string>()
  let match

  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1])
  }

  return Array.from(variables)
}

/**
 * Validates that all required variables are provided.
 *
 * @param template - The template string
 * @param variables - The provided variables
 * @returns Array of missing variable names, empty if all provided
 */
export function validateVariables(
  template: string,
  variables: Record<string, string>
): string[] {
  const required = extractVariables(template)
  const provided = new Set(Object.keys(variables))

  return required.filter(v => !provided.has(v))
}

export function getPacketGenerationUserMessage(error?: string) {
  const message = error?.trim() ?? ''

  if (!message) {
    return ''
  }

  if (message.includes('Resume generation returned incomplete ATS content.')) {
    return 'The profile does not have enough structured resume material yet to generate a reliable tailored resume.'
  }

  return 'The application materials could not be generated yet.'
}

export function getPacketGenerationRemediationHint(error?: string) {
  const message = error?.trim() ?? ''

  if (message.includes('Resume generation returned incomplete ATS content.')) {
    return 'Update the base resume text, base cover letter text, uploaded files, or structured experience in Profile, then try generating again.'
  }

  if (!message) {
    return ''
  }

  return 'Check the profile materials and experience, then try generating again.'
}

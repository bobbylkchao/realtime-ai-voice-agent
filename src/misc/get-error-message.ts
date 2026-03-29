export const getErrorMessage = (
  from: string,
  error: unknown
): {
  from: string
  errorMessage: string
  errorStack: string | undefined
} => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  return { from, errorMessage, errorStack }
}

import { ConnectClient } from '@aws-sdk/client-connect'
import { getErrorMessage } from '@/misc/get-error-message'
import logger from '@/misc/logger'

export let amazonConnectClient: ConnectClient | undefined

/**
 * Initializes the Amazon Connect SDK client when AMAZON_CONNECT_SDK_ENABLE=true
 * and required env vars are set. Safe to skip for webhook-only testing.
 */
export const initAmazonConnectClient = (): void => {
  if (process.env.AMAZON_CONNECT_SDK_ENABLE !== 'true') {
    logger.info(
      '[Amazon Connect] AMAZON_CONNECT_SDK_ENABLE is not true; skipping Connect client init'
    )
    return
  }

  try {
    if (
      !process.env.AWS_REGION ||
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY
    ) {
      throw new Error(
        'AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY must be set when AMAZON_CONNECT_SDK_ENABLE=true'
      )
    }

    amazonConnectClient = new ConnectClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    logger.info('[Amazon Connect] Connect client initialized')
  } catch (error) {
    const errorDetails = getErrorMessage('amazon-connect', error)
    logger.error(
      errorDetails,
      '[Amazon Connect] Error occurred while initializing Connect client'
    )
  }
}

import { UpdateContactAttributesCommand } from '@aws-sdk/client-connect'
import { getErrorMessage } from '@/misc/get-error-message'
import logger from '@/misc/logger'
import { amazonConnectClient } from './client'

export const updateContactAttributes = async (
  contactId: string,
  attributes: Record<string, string>
): Promise<void> => {
  try {
    if (!amazonConnectClient) {
      logger.warn(
        { contactId },
        '[Amazon Connect] Client not initialized; skip updateContactAttributes'
      )
      return
    }
    if (!process.env.AMAZON_CONNECT_INSTANCE_ID) {
      throw new Error('AMAZON_CONNECT_INSTANCE_ID is not set')
    }

    await amazonConnectClient.send(
      new UpdateContactAttributesCommand({
        InstanceId: process.env.AMAZON_CONNECT_INSTANCE_ID,
        InitialContactId: contactId,
        Attributes: attributes,
      })
    )
  } catch (error) {
    const errorDetails = getErrorMessage('updateContactAttributes', error)
    logger.error(
      errorDetails,
      '[Amazon Connect] Error occurred while updating contact attributes'
    )
  }
}

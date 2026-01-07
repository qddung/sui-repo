/**
 * Utility functions for processing checkpoints
 */

import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';

/**
 * Extract object IDs from transaction changes
 * This handles different types of object changes in Sui transactions
 */
export function extractObjectIdsFromTransaction(tx: any): string[] {
  const objectIds = new Set<string>();

  if (tx.objectChanges) {
    for (const change of tx.objectChanges) {
      // Handle different change types
      if (change.type === 'created' && 'objectId' in change) {
        objectIds.add(change.objectId);
      } else if (change.type === 'mutated' && 'objectId' in change) {
        objectIds.add(change.objectId);
      } else if (change.type === 'published' && 'objectId' in change) {
        objectIds.add(change.objectId);
      } else if (change.type === 'transferred' && 'objectId' in change) {
        objectIds.add(change.objectId);
      } else if ('objectId' in change) {
        // Generic fallback for any change with objectId
        objectIds.add(change.objectId);
      } else if ('object' in change && change.object) {
        // Some changes have nested object references
        const obj = change.object;
        if (typeof obj === 'object' && 'objectId' in obj) {
          objectIds.add(obj.objectId);
        }
      }
    }
  }

  // Also check balance changes for object references
  if (tx.balanceChanges) {
    for (const balanceChange of tx.balanceChanges) {
      if ('owner' in balanceChange && balanceChange.owner) {
        const owner = balanceChange.owner as any;
        if (owner && typeof owner === 'object') {
          if ('ObjectOwner' in owner) {
            objectIds.add(owner.ObjectOwner);
          } else if ('objectId' in owner) {
            objectIds.add(owner.objectId);
          }
        }
      }
    }
  }

  return Array.from(objectIds);
}


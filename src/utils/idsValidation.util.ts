import { NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';

// Validates that all provided IDs exist and are valid UUIDs.
// Throws a NotFoundException if any ID fails validation.

export const validateUUIDs = (...ids: (string | undefined | null)[]): void => {
  for (const id of ids) {
    if (!id || isUUID(id)) {
      throw new NotFoundException(
        'Order, Product, User, or Tenant with given ID not found',
      );
    }
  }
};

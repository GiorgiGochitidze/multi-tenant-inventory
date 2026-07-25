import { NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';

// Validates that all provided IDs are valid UUIDs.
// Throws a NotFoundException if any ID is missing or invalid.
export const validateUUIDs = (...ids: (string | undefined | null)[]): void => {
  for (const id of ids) {
    if (!id || !isUUID(id)) {
      throw new NotFoundException(
        'Order, Product, User, or Tenant with given ID not found',
      );
    }
  }
};

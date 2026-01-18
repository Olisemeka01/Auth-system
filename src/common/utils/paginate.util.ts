import { Paginated, PaginateQuery, paginate } from 'nestjs-paginate';
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface PaginationConfig {
  sortableColumns: string[];
  searchableColumns?: string[];
  defaultSortBy?: [string, 'ASC' | 'DESC'][];
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Reusable pagination utility for TypeORM query builders
 */
export class PaginateUtil {
  /**
   * Apply pagination to a query builder with configuration
   */
  static async paginate<T extends ObjectLiteral>(
    query: PaginateQuery,
    queryBuilder: SelectQueryBuilder<T>,
    config: PaginationConfig,
  ): Promise<Paginated<T>> {
    return paginate(query, queryBuilder, {
      sortableColumns: config.sortableColumns as any,
      searchableColumns: (config.searchableColumns as any) || [],
      defaultSortBy: (config.defaultSortBy as any) || [['createdAt', 'DESC']],
      defaultLimit: config.defaultLimit || 10,
      maxLimit: config.maxLimit || 100,
    });
  }
}

/**
 * Common pagination configurations
 */
export const PAGINATION_CONFIG: Record<string, PaginationConfig> = {
  USER: {
    sortableColumns: [
      'id',
      'email',
      'first_name',
      'last_name',
      'created_at',
      'updated_at',
    ],
    searchableColumns: ['email', 'first_name', 'last_name'],
    defaultSortBy: [['created_at', 'DESC']],
    defaultLimit: 10,
  },
  CLIENT: {
    sortableColumns: [
      'id',
      'email',
      'first_name',
      'last_name',
      'created_at',
      'updated_at',
    ],
    searchableColumns: ['email', 'first_name', 'last_name'],
    defaultSortBy: [['created_at', 'DESC']],
    defaultLimit: 10,
  },
  AUDIT_LOG: {
    sortableColumns: ['id', 'action', 'entity', 'created_at'],
    searchableColumns: ['action', 'entity'],
    defaultSortBy: [['created_at', 'DESC']],
    defaultLimit: 20,
  },
};

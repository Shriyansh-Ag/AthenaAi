import { DocumentModel, IDocument } from '../models/document.model';
import type { DocumentQuery, PaginatedResponse } from '../types';

export class DocumentRepository {
  async create(data: {
    userId: string;
    originalName: string;
    displayName: string;
    mimeType: string;
    extension: string;
    size: number;
    storagePath: string;
    storageKey: string;
    checksum: string;
    status?: string;
    processingStage?: string;
  }): Promise<IDocument> {
    const doc = new DocumentModel(data);
    return doc.save();
  }

  async findById(id: string): Promise<IDocument | null> {
    return DocumentModel.findById(id);
  }

  async findByIdAndUser(id: string, userId: string): Promise<IDocument | null> {
    return DocumentModel.findOne({ _id: id, userId, status: { $ne: 'deleted' } });
  }

  async findByUserId(
    userId: string,
    query: DocumentQuery
  ): Promise<PaginatedResponse<IDocument>> {
    const { page, limit, search, status, mimeType, sortBy, sortOrder } = query;

    const filter: Record<string, unknown> = {
      userId,
      status: status || { $ne: 'deleted' },
    };

    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
      ];
    }

    if (mimeType) {
      filter.mimeType = mimeType;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy || 'uploadedAt';

    const [data, total] = await Promise.all([
      DocumentModel.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments(filter),
    ]);

    return {
      data: data.map(doc => {
        const { _id, __v, storageKey, storagePath, ...rest } = doc as any;
        return {
          ...rest,
          id: _id.toString(),
        } as unknown as IDocument;
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(
    id: string,
    userId: string,
    update: Partial<Pick<IDocument, 'displayName' | 'status' | 'processingStage' | 'metadata' | 'extractedContent'>>
  ): Promise<IDocument | null> {
    return DocumentModel.findOneAndUpdate(
      { _id: id, userId, status: { $ne: 'deleted' } },
      { $set: update },
      { new: true }
    );
  }

  async softDelete(id: string, userId: string): Promise<IDocument | null> {
    return DocumentModel.findOneAndUpdate(
      { _id: id, userId, status: { $ne: 'deleted' } },
      { $set: { status: 'deleted' } },
      { new: true }
    );
  }

  async findDuplicate(userId: string, checksum: string): Promise<IDocument | null> {
    return DocumentModel.findOne({
      userId,
      checksum,
      status: { $ne: 'deleted' },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return DocumentModel.countDocuments({ userId, status: { $ne: 'deleted' } });
  }

  async getUserStats(userId: string): Promise<any> {
    const pipeline = [
      { $match: { userId, status: { $ne: 'deleted' } } },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalDocuments: { $sum: 1 },
                totalStorageUsed: { $sum: '$size' },
                processedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] }
                },
                processingCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
                },
                failedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                }
              }
            }
          ],
          byType: [
            {
              $group: {
                _id: '$mimeType',
                count: { $sum: 1 },
                storage: { $sum: '$size' }
              }
            },
            { $sort: { count: -1 } }
          ],
          storageOverTime: [
            {
              $match: {
                uploadedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // last 30 days
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$uploadedAt' }
                },
                size: { $sum: '$size' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          recentErrors: [
            { $match: { status: 'failed' } },
            { $sort: { uploadedAt: -1 } },
            { $limit: 5 },
            { $project: { displayName: 1, uploadedAt: 1, status: 1 } }
          ]
        }
      }
    ];

    const result = await DocumentModel.aggregate(pipeline as any[]);
    const data = result[0];

    return {
      overview: data.overview[0] || {
        totalDocuments: 0,
        totalStorageUsed: 0,
        processedCount: 0,
        processingCount: 0,
        failedCount: 0
      },
      byType: data.byType || [],
      storageOverTime: data.storageOverTime || [],
      recentErrors: data.recentErrors || []
    };
  }
}

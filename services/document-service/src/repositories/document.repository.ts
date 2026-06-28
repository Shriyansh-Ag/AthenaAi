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
    update: Partial<Pick<IDocument, 'displayName' | 'status' | 'processingStage' | 'metadata'>>
  ): Promise<IDocument | null> {
    return DocumentModel.findOneAndUpdate(
      { _id: id, userId },
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
}

import { z } from 'zod'

export const UploadFileSchema = z.object({
  file: z.any().refine((file) => file && file.buffer, 'File is required'),
})

export const GetMediaSchema = z.object({
  id: z.string().uuid(),
})

export const ListMediaSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
})

export const DeleteMediaSchema = z.object({
  id: z.string().uuid(),
})

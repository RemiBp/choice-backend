import { z } from "zod";

export const createServiceSchema = z.object({
  serviceTypeId: z.number({ required_error: "Service type is required" }),
  title: z.string().min(3, "Service title is required"),
  description: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().min(3, "Location is required").optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0").optional(),
  maxCapacity: z.number().int().positive().optional(),
  serviceImages: z.array(z.string()).max(9, "Max 9 images allowed").optional(),
  slug: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object({
  title: z.string().min(3, "Service title is required").optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().min(3, "Location is required").optional(),
  price: z.number().min(0).optional(),
  maxCapacity: z.number().int().positive().optional(),
  serviceImages: z.array(z.string()).max(9, "Max 9 images allowed").optional(),
  slug: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export const getServiceByIdSchema = z.object({
  serviceId: z.number().int().positive(),
});
export type GetServiceByIdInput = z.infer<typeof getServiceByIdSchema>;

export const deleteServiceSchema = z.object({
  serviceId: z.number().int().positive(),
});
export type DeleteServiceInput = z.infer<typeof deleteServiceSchema>;

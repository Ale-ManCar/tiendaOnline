import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Incluye una mayúscula')
  .regex(/[a-z]/, 'Incluye una minúscula')
  .regex(/\d/, 'Incluye un número')
  .regex(/[^\w\s]/, 'Incluye un carácter especial');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registrationSchema = z
  .object({
    name: z.string().trim().min(3, 'Ingresa tu nombre completo'),
    email: z.string().trim().toLowerCase().email('Correo inválido'),
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Nombre obligatorio'),
  description: z.string().trim().min(1, 'Descripción obligatoria'),
  category: z.string().trim().min(1, 'Categoría obligatoria'),
  sku: z.string().trim().min(1, 'SKU obligatorio'),
  price: z.coerce.number().positive('El precio debe ser mayor a cero'),
  stock: z.coerce.number().int('Usa un número entero').min(0, 'Stock inválido'),
  image: z.string().url('URL inválida'),
  featured: z.boolean(),
  active: z.boolean(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Nombre de categoría obligatorio'),
  description: z.string().trim().optional(),
  active: z.boolean(),
});

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(3),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().regex(/^(\+593|0)9\d{8}$/, 'Teléfono ecuatoriano inválido'),
  address: z.string().trim().min(8),
  city: z.string().trim().min(2),
  notes: z.string().optional(),
  paymentMethod: z.enum(['Tarjeta', 'Transferencia', 'Contra entrega']),
  terms: z.literal(true, { message: 'Debes aceptar los términos' }),
});

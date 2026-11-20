import { describe,it,expect } from 'vitest';
import { registerSchema,passwordSchema,usernameSchema,addressSchema } from '@/lib/account-schema';
const valid={full_name:'Pelanggan Uji',username:'pelanggan_uji',email:'customer@example.com',phone:'081234567890',password:'Password9',confirm:'Password9',birth_date:'',terms:true};
describe('Account rules',()=>{
 it('rejects passwords shorter than 8 characters',()=>{expect(passwordSchema.safeParse('1234567').success).toBe(false);expect(passwordSchema.safeParse('12345678').success).toBe(true);});
 it('requires matching password confirmation',()=>{expect(registerSchema.safeParse({...valid,confirm:'different'}).success).toBe(false);expect(registerSchema.safeParse(valid).success).toBe(true);});
 it('requires terms consent',()=>{expect(registerSchema.safeParse({...valid,terms:false}).success).toBe(false);});
 it('requires a valid active email address',()=>{expect(registerSchema.safeParse({...valid,email:'not-an-email'}).success).toBe(false);});
 it('normalizes usernames for case-insensitive uniqueness',()=>{expect(usernameSchema.parse('Customer_01')).toBe('customer_01');expect(usernameSchema.safeParse('user@name').success).toBe(false);});
 it('requires a five digit postal code',()=>{const a={recipient_name:'Pelanggan',phone:'081234567890',label:'Rumah',province:'Jakarta',city:'Jakarta',district:'Menteng',village:'Menteng',postal_code:'12345',full_address:'Jalan Pengujian nomor 10',notes:''};expect(addressSchema.safeParse({...a,postal_code:'1234'}).success).toBe(false);expect(addressSchema.safeParse(a).success).toBe(true);});
});

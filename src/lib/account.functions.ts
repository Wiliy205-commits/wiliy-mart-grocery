import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { profileSchema, addressSchema } from './account-schema';

// The lookup is service-only: never reveal an email for a public username.
export const loginWithIdentity = createServerFn({method:'POST'})
.inputValidator((v:unknown)=>z.object({identity:z.string().trim().min(1).max(255),password:z.string().min(1).max(128)}).parse(v))
.handler(async({data})=>{
 const {createClient}=await import('@supabase/supabase-js');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 let email=data.identity;
 if(!email.includes('@')){const {data:found}=await supabaseAdmin.rpc('login_email_for_username',{_username:email.toLowerCase()}); email=found ?? 'unknown-account@invalid.example';}
 const url=process.env['SUPABASE_URL']; const key=process.env['SUPABASE_PUBLISHABLE_KEY'];
 if(!url||!key) throw new Error('Layanan masuk tidak tersedia');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const {data:result,error}=await client.auth.signInWithPassword({email,password:data.password});
 if(error||!result.session) return {ok:false as const,error:'Email/username atau kata sandi salah, atau email belum diverifikasi.'};
 return {ok:true as const,session:{access_token:result.session.access_token,refresh_token:result.session.refresh_token}};
});
export const getAccount = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {data,error}=await context.supabase.from('profiles').select('*').eq('id',context.userId).single();if(error)throw new Error('Profil gagal dimuat');
 let avatar:string|null=null;
 if(data.avatar_url){const {data:signed}=await context.supabase.storage.from('avatars').createSignedUrl(data.avatar_url,3600);avatar=signed?.signedUrl??null;}
 return {...data,avatar};
});
export const updateProfile=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>profileSchema.parse(v)).handler(async({data,context})=>{
 const {error}=await context.supabase.from('profiles').update({...data,birth_date:data.birth_date||null,gender:data.gender||null}).eq('id',context.userId);
 if(error)throw new Error(error.code==='23505'?'Username sudah digunakan':'Profil gagal disimpan');return {ok:true};
});
export const getAddresses=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{const {data,error}=await context.supabase.from('addresses').select('*').eq('user_id',context.userId).order('is_default',{ascending:false}).order('created_at');if(error)throw new Error('Alamat gagal dimuat');return data;});
export const saveAddress=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>addressSchema.parse(v)).handler(async({data,context})=>{const {id,...values}=data; const q=id?context.supabase.from('addresses').update(values).eq('id',id).eq('user_id',context.userId):context.supabase.from('addresses').insert({...values,user_id:context.userId});const {data:row,error}=await q.select('id').single();if(error)throw new Error('Alamat gagal disimpan');return row;});
export const removeAddress=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.string().uuid().parse(v)).handler(async({data,context})=>{const {error}=await context.supabase.from('addresses').delete().eq('id',data).eq('user_id',context.userId);if(error)throw new Error('Alamat gagal dihapus');return {ok:true};});
export const defaultAddress=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.string().uuid().parse(v)).handler(async({data,context})=>{const {error}=await context.supabase.rpc('set_default_address',{_id:data});if(error)throw new Error('Alamat utama gagal diubah');return {ok:true};});
export const getMyOrders=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{const {data,error}=await context.supabase.from('orders').select('*,order_items(*)').eq('user_id',context.userId).order('created_at',{ascending:false});if(error)throw new Error('Pesanan gagal dimuat');return data;});
export const deleteAccount=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({confirm:z.literal('HAPUS'),password:z.string().max(128)}).parse(v)).handler(async({data,context})=>{
 const {data:auth,error}=await context.supabase.auth.getUser();if(error||!auth.user)throw new Error('Silakan masuk kembali');
 if(auth.user.app_metadata.providers?.includes('email')){const {error:pw}=await context.supabase.auth.signInWithPassword({email:auth.user.email??'',password:data.password});if(pw)throw new Error('Kata sandi salah');}
 else if(Date.now()-Date.parse(auth.user.last_sign_in_at??'')>300000||!auth.user.last_sign_in_at)throw new Error('Masuk kembali dengan Google sebelum menghapus akun (maksimal 5 menit).');
 const {data:admin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(admin)throw new Error('Akun admin tidak dapat dihapus di sini. Hubungi pengelola lain untuk mencabut peran admin terlebih dahulu.');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data:files}=await supabaseAdmin.storage.from('avatars').list(context.userId);
 if(files?.length){const {error:storageError}=await supabaseAdmin.storage.from('avatars').remove(files.map(f=>`${context.userId}/${f.name}`));if(storageError)throw new Error('Foto gagal dihapus. Coba lagi.');}
 const {error:deleted}=await supabaseAdmin.auth.admin.deleteUser(context.userId);if(deleted)throw new Error('Akun gagal dihapus');return {ok:true};
});
export const getCustomers=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{const{data:admin,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(roleError||!admin)throw new Error('Akses ditolak');const{data,error}=await context.supabase.from('profiles').select('id,full_name,username,email,phone,created_at').order('created_at',{ascending:false});if(error)throw new Error('Pelanggan gagal dimuat');return data;});

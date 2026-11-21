import {beforeAll,describe,expect,it} from 'vitest';
import {createClient} from '@supabase/supabase-js';
import type {Database} from '@/integrations/supabase/types';
const url=process.env['SUPABASE_URL']??'';
const key=process.env['SUPABASE_PUBLISHABLE_KEY']??'';
const tokenA=process.env['ACCOUNT_TEST_TOKEN_A']??'';
const tokenB=process.env['ACCOUNT_TEST_TOKEN_B']??'';
const idA=process.env['ACCOUNT_TEST_ID_A']??'';
const idB=process.env['ACCOUNT_TEST_ID_B']??'';
function client(token:string){return createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false,storageKey:`test-${token===tokenA?'a':'b'}`} ,global:{headers:{Authorization:`Bearer ${token}`}}});}
// Real authenticated integration tests; supply two disposable users, never production customer tokens.
describe.skipIf(!tokenA||!tokenB)('customer account access',()=>{
 let a:ReturnType<typeof client>;let b:ReturnType<typeof client>;let addressId:string;
 const username=`test_${Date.now()}`;
 beforeAll(async()=>{a=client(tokenA);b=client(tokenB);const profile={full_name:'Pelanggan Uji',username,phone:'+6281234567890'};const{error}=await a.from('profiles').update(profile).eq('id',idA);expect(error).toBeNull();const {data,error:addressError}=await a.from('addresses').insert({user_id:idA,recipient_name:'Pelanggan Uji',phone:'+6281234567890',label:'Rumah',province:'Jawa Barat',city:'Bandung',district:'Coblong',village:'Dago',postal_code:'40135',full_address:'Alamat pengujian otomatis',notes:'Data uji'}).select('id').single();expect(addressError).toBeNull();if(!data)throw new Error('Address fixture missing');addressId=data.id;});
 it('ordinary registration assigns customer, never admin',async()=>{const {data,error}=await a.from('user_roles').select('role').eq('user_id',idA);expect(error).toBeNull();expect(data?.map(r=>r.role)).toEqual(['user']);});
 it('a customer cannot grant themselves admin',async()=>{const {error}=await a.from('user_roles').insert({user_id:idA,role:'admin'});expect(error).not.toBeNull();});
 it('usernames must be unique',async()=>{const {error}=await b.from('profiles').update({full_name:'Pelanggan Kedua',username,phone:'+6281234567890'}).eq('id',idB);expect(error?.code).toBe('23505');});
 it('customers only see their own profile',async()=>{const {data,error}=await b.from('profiles').select('id').eq('id',idA);expect(error).toBeNull();expect(data).toEqual([]);});
 it('customers cannot change another profile',async()=>{const {data,error}=await b.from('profiles').update({full_name:'Forbidden'}).eq('id',idA).select('id');expect(error).toBeNull();expect(data).toEqual([]);const own=await a.from('profiles').select('full_name').eq('id',idA).single();expect(own.data?.full_name).toBe('Pelanggan Uji');});
 it('customers cannot read another shipping address',async()=>{const {data,error}=await b.from('addresses').select('id').eq('id',addressId);expect(error).toBeNull();expect(data).toEqual([]);});
 it('customers cannot delete another shipping address',async()=>{const {data,error}=await b.from('addresses').delete().eq('id',addressId).select('id');expect(error).toBeNull();expect(data).toEqual([]);const own=await a.from('addresses').select('id').eq('id',addressId).single();expect(own.data?.id).toBe(addressId);});
 it('username-to-email resolution is not publicly accessible',async()=>{const {error}=await a.rpc('login_email_for_username',{p_username:username});expect(error).not.toBeNull();});
 it('customers cannot upload avatars into another user folder',async()=>{const {error}=await b.storage.from('avatars').upload(`${idA}/forbidden.png`,new Uint8Array([1,2,3]),{contentType:'image/png'});expect(error).not.toBeNull();});
});

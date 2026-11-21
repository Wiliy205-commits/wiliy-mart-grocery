import { createFileRoute } from '@tanstack/react-router';
import { queryOptions,useSuspenseQuery } from '@tanstack/react-query';
import { getCustomers } from '@/lib/account.functions';
import { accountHead } from '@/lib/account-schema';
const options=()=>queryOptions({queryKey:['admin','customers'],queryFn:()=>getCustomers()});
export const Route=createFileRoute('/_authenticated/admin/customers')({head:()=>accountHead('Data pelanggan','Data pelanggan untuk operasional toko Wiliy Mart.'),loader:async({context})=>{if(context.isAdmin)await context.queryClient.ensureQueryData(options());},component:Customers});
function Customers(){const{data}=useSuspenseQuery(options());return <div><h2 className="text-2xl">Data pelanggan</h2><ul className="mt-6 divide-y divide-border border-y border-border">{data.map(p=><li key={p.id} className="grid gap-4 py-5 md:grid-cols-3"><div><h3 className="text-lg">{p.full_name||'Pelanggan'}</h3><p className="mt-1 text-sm text-muted-foreground">@{p.username||'belum_diatur'}</p></div><div className="min-w-0 text-sm"><p className="break-all">{p.email||'Email belum diatur'}</p><p className="mt-2">{p.phone||'WhatsApp belum diatur'}</p></div><p className="text-sm text-muted-foreground">Bergabung {new Date(p.created_at).toLocaleDateString('id-ID')}</p></li>)}</ul></div>;}

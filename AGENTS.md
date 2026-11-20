<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Catalog reads go through public `createServerFn`s in `src/lib/catalog.functions.ts` (publishable key, RLS) so pages SSR with loaders + `useSuspenseQuery`.
- Orders are created only via the `place_order` SECURITY DEFINER database function (called from `src/lib/orders.functions.ts`); it validates input, prices items from the DB and decrements stock atomically — never trust client prices.
- Cancelling an order restocks via the `orders_restock` trigger; cancelled orders cannot be reactivated.
- Admin checks use `has_role(uid,'admin')` from `user_roles`; signup assigns only the customer (`user`) role to prevent self-escalation, and admin grants require trusted administration.
- Product images live in the private `product-images` bucket (public buckets are blocked in this workspace); uploads store a long-lived signed URL in `products.image_url`.
- Checkout payment options and bank details are configured in `src/lib/store-config.ts`.
- Customer pages live below the managed authenticated layout; private reads and writes use authenticated server functions and explicit owner filters so operational admin access never widens customer history.
- Username sign-in resolves email only through a service-only RPC inside the password-verifying server function; never expose a public username-to-email lookup.
- Avatar paths are user-scoped objects in a private bucket; generate temporary display links only for authenticated owners.
- Checkout validates an optional bearer token before calling `place_order` as the customer, retaining guest checkout without accepting client user IDs.

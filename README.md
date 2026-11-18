# Wiliy Mart Grocery

Build a complete, modern, responsive full-stack e-commerce website called "Wiliy Mart".



PROJECT IDENTITY:

- Brand name: Wiliy Mart

- Tagline: "Belanja Mudah, Kebutuhan Terpenuhi."

- Business: Online grocery store and daily necessities.

- Language: Indonesian.

- Currency: Indonesian Rupiah (IDR).

- Creator credit: Made by Wiliy.



DESIGN DIRECTION:

Create a premium, aesthetic, minimalist, modern grocery shopping website.



Color palette:

- Navy: #172A46

- Dark Navy: #101D32

- Beige: #E9DFC9

- Cream: #F7F3EA

- White: #FFFFFF



Use elegant typography, spacious layouts, rounded product cards, subtle shadows, smooth animations, and beautiful product photography.



The website must be fully responsive on mobile, tablet, and desktop.



1. HOMEPAGE

Create a professional homepage featuring:

- Navbar with Wiliy Mart logo.

- Navigation: Home, Products, Categories, About Us.

- Search bar.

- Shopping cart icon with live item count.

- Hero section with headline:

  "Belanja Mudah, Kebutuhan Terpenuhi."

- CTA button: "Belanja Sekarang".

- Featured product categories.

- Best-selling products.

- New arrivals.

- Special promotions.

- Why choose Wiliy Mart section.

- Professional footer.



2. PRODUCT CATEGORIES

Create categories:

- Makanan

- Minuman

- Sembako

- Mi Instan

- Makanan Ringan

- Kebutuhan Rumah Tangga



3. PRODUCT CATALOG

Create a functional product catalog with:

- Product images.

- Product names.

- Prices in IDR.

- Stock availability.

- Product descriptions.

- Category labels.

- Search functionality.

- Category filtering.

- Price sorting.

- Add to cart button.



Use sample products:

- Indomie Goreng

- Gula Pasir 1 Kg

- Minyak Goreng 1 Liter

- Beras 1 Kg

- Kopi

- Teh

- Air Mineral

- Snack



Use realistic placeholder prices and label sample inventory clearly.



4. PRODUCT DETAILS

Create product detail pages with:

- Large product image.

- Product description.

- Price.

- Stock status.

- Quantity selector.

- Add to cart button.



5. SHOPPING CART

Build a functional shopping cart:

- Add products.

- Remove products.

- Increase or decrease quantity.

- Automatically calculate subtotal.

- Calculate total.

- Display selected products.

- Persist cart data between page refreshes.



6. CHECKOUT

Create a clean checkout page with:

- Customer name.

- WhatsApp number.

- Delivery address.

- Order notes.

- Order summary.

- Payment method selection.

- Order confirmation.



Support configurable payment methods:

- Cash on Delivery (COD).

- Manual bank transfer.



Do not claim a payment is completed without verification.



7. ADMIN DASHBOARD

Create a protected admin dashboard with:

- Sales overview.

- Total products.

- Total orders.

- Total revenue.

- Add new products.

- Edit products.

- Delete products.

- Upload product images.

- Manage product categories.

- Manage inventory.

- View customer orders.

- Update order status.



Order statuses:

- Pending.

- Processing.

- Shipped.

- Completed.

- Cancelled.



Only authenticated administrators can access admin features.



8. BACKEND AND DATABASE

Use Supabase for backend infrastructure.



Create database tables:

- profiles

- products

- categories

- orders

- order_items



Implement:

- Supabase authentication.

- Database relationships.

- Supabase Storage for product images.

- Row Level Security (RLS).

- Secure server-side order validation.

- Stock management.

- Protected admin routes.



Never expose service role keys in frontend code.



9. ORDER MANAGEMENT

When customers place orders:

- Validate customer information.

- Validate product stock.

- Calculate prices on the server.

- Save order records.

- Save order item details.

- Update inventory safely.

- Display order confirmation.



10. USER EXPERIENCE

Include:

- Loading indicators.

- Error messages.

- Empty cart states.

- Success notifications.

- Confirmation dialogs.

- Mobile-friendly navigation.

- Accessible buttons and forms.



11. SEO AND PERFORMANCE

Implement:

- SEO-friendly page titles.

- Meta descriptions.

- Optimized images.

- Fast loading.

- Semantic HTML.

- Responsive layouts.



12. PROJECT STRUCTURE

Use:

- React.

- TypeScript.

- Tailwind CSS.

- Reusable components.

- Supabase integration.

- Clean and maintainable architecture.



13. DEPLOYMENT

Prepare the application for deployment using:

- GitHub for source control.

- Supabase for backend and database.

- Lovable publishing or a supported hosting platform.

- Custom domain support.



IMPORTANT DEVELOPMENT INSTRUCTIONS:

- Do not create a static mockup only.

- Make all buttons and interactions functional.

- Connect real database operations where configured.

- Do not fabricate successful transactions.

- Use secure authentication and database policies.

- Do not invent real business contact details.

- Use clearly labeled sample data until actual products are entered.



Build the website in stages. Start with a polished and fully responsive frontend, then implement database integration, authentication, checkout, and admin dashboard.



The final result should feel like a professional Indonesian online grocery store.



FOOTER BRANDING:

"Wiliy Mart — Belanja Mudah, Kebutuhan Terpenuhi."

"Made by Wiliy."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8965d16b-7e82-4e54-81b8-eb819f528739).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

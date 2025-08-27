# Govinda Dughdalay - Milk Shop Management System

A modern React-based milk shop management system with complete inventory, billing, customer management, and WhatsApp integration.

## Features

### 🛒 **Billing System**
- Product search and filtering
- Shopping cart with quantity management  
- Invoice generation with PDF download
- WhatsApp integration for sharing invoices
- Customer creation during checkout
- Support for payment status (Paid/Pending)

### 📦 **Product Management**
- Complete inventory management
- Product categories (Milk, Ghee, Paneer, Sweets, Other)
- Low stock alerts and tracking
- Stock deduction on sales
- Add/Edit/Delete products

### 👥 **Customer Management**
- Customer database with contact info
- Religion-based tagging for targeted marketing
- Purchase history tracking
- Pending bills monitoring
- Search and filter customers

### 📄 **Bills & Invoicing**
- Professional PDF invoice generation
- Invoice numbering (GD-YYMM-XXXX format)
- WhatsApp sharing with pre-filled messages
- Bill status tracking
- Complete sales history

### 📊 **Dashboard & Analytics**
- Real-time sales metrics
- Customer count tracking
- Pending bills summary
- Low stock alerts
- Sales chart (last 7 days) with Chart.js integration

### 📱 **WhatsApp Marketing**
- Bulk messaging to customers
- Filter by religion or general tags
- Preview recipients before sending
- Marketing campaign management

### 💾 **Data Management**
- **Cloud Storage**: Supabase database integration
- **Multi-User Support**: Secure user authentication
- **Data Isolation**: Row Level Security (RLS)
- **Real-time Sync**: Cloud-based data persistence
- **Migration**: Automatic localStorage to Supabase migration
- **Backup/Export**: JSON export functionality
- Export/Import backup functionality
- Data validation and error handling

## Technology Stack

- **Frontend**: React 19 with Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: jsPDF
- **Charts**: Chart.js  
- **Styling**: CSS with custom variables
- **Development**: ESLint, Prettier
- **Build Tool**: Vite with HMR

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for database and authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hmttech/milk-shop-app.git
   cd milk-shop-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create a Supabase project
   - Run the database schema
   - Configure environment variables

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   - Navigate to `http://localhost:3000`
   - Create an account or sign in
   - The app will automatically set up default products

### Production Build

```bash
npm run build
npm run preview
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure

```
src/
├── components/           # React components
│   ├── App.jsx          # Main application
│   ├── Billing/         # Billing & cart management
│   ├── Products/        # Product inventory
│   ├── Customers/       # Customer management
│   ├── Bills/           # Invoice management
│   ├── Dashboard/       # Analytics dashboard
│   └── WhatsAppMarketing/ # Marketing tools
├── utils/               # Utility functions
│   ├── helpers.js       # Common utilities
│   ├── storage.js       # Data persistence
│   ├── business.js      # Business logic
│   ├── pdf.js           # PDF generation
│   └── generators.js    # ID/number generation
├── styles/
│   └── main.css         # Application styles
└── main.jsx             # Application entry point
```

## Usage Guide

### Getting Started

1. **Add Products**: Start by adding your products in the "Products" tab
2. **Add Customers**: Create customer profiles in the "Customers" tab  
3. **Create Sales**: Use the "Billing" tab to create invoices
4. **Monitor Business**: Check the "Dashboard" for analytics
5. **Marketing**: Use "WhatsApp Marketing" for customer outreach

### Creating Your First Sale

1. Go to **Billing** tab
2. Search and add products to cart
3. Fill customer details
4. Click **"Create Invoice & PDF"**
5. PDF automatically downloads
6. Share via WhatsApp using the toast notification

### Data Backup

- **Export**: Click "Export Backup" in header to download JSON backup
- **Import**: Click "Import Backup" to restore from JSON file

## Customization

### Shop Information
Edit shop details in `src/utils/storage.js`:

```javascript
const defaultState = {
  shop: { 
    name: "Your Shop Name", 
    phone: "+91 XXXXX XXXXX", 
    addr: "Your Address" 
  },
  // ...
};
```

### Product Categories
Modify categories in product components:
```javascript
["Milk", "Ghee", "Paneer", "Sweets", "Other"]
```

### Invoice Numbering
Customize format in `src/utils/generators.js`:
```javascript
return `GD-${y}${m}-${seq}`; // Change "GD" prefix
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@govindadughdalay.com

---

**Built with ❤️ for small business owners**

# TruelyPay Frontend - Secure MFA Payment Integration

A comprehensive React TypeScript application that demonstrates both a vendor payment interface and easy-to-integrate TruelyPay MFA components for secure payment processing.

## Architecture Overview

This frontend serves **two distinct purposes**:

### 1. **Vendor Demo Application**

A complete payment checkout flow that simulates a merchant's existing payment system, demonstrating how a typical e-commerce site would integrate TruelyPay's MFA services.

### 2. **TruelyPay Integration Components**

Ready-to-use React components that any vendor can integrate into their existing applications with just a few lines of code to add secure MFA authentication to their payment flows.

## Key Features

- **Dual Architecture**: Vendor demo + plug-and-play integration components
- **Seamless MFA Integration**: Easy API integration requiring minimal code changes
- **Multiple MFA Methods**: SMS, Email, and Duo Security support
- **Real-time Authentication**: Live MFA challenge handling with visual feedback
- **TypeScript Support**: Full type safety and IntelliSense
- **Responsive Design**: Mobile-friendly payment interface
- **Production Ready**: Optimized build with Vite for fast performance

## Technology Stack

- **React 19.1.1** - Latest React with concurrent features
- **TypeScript** - Full type safety and developer experience
- **Vite** - Fast development and optimized production builds
- **ESLint** - Code quality and consistency
- **CSS3** - Modern styling with animations and responsive design

## Prerequisites

- Node.js 16+
- npm or yarn package manager
- Backend MFA service running (see backend README)

## Quick Start

### 1. Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# OR
yarn install
```

### 2. Start Development Server

```bash
# Start Vite dev server
npm run dev
# OR
yarn dev
```

The application will be available at `http://localhost:5173`

### 3. Build for Production

```bash
# Build optimized production bundle
npm run build
# OR
yarn build

# Preview production build locally
npm run preview
# OR
yarn preview
```

## Project Structure

```
frontend/
├── index.html                      # Entry HTML file
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
├── eslint.config.js                # ESLint rules and setup
│
├── public/                         # Static assets
│   ├── crop_logo.png              # TruelyPay branding
│   ├── TruelyLogo.png             # Company logo
│   └── vite.svg                   # Vite icon
│
└── src/                           # Source code
    ├── main.tsx                   # Application entry point
    ├── App.tsx                    # Main vendor demo application
    ├── App.css                    # Application styling
    ├── index.css                  # Global styles
    │
    ├── assets/                    # React assets
    │   └── react.svg
    │
    └── components/                # React components
        ├── PaymentAmount.tsx      # VENDOR: Amount input component
        ├── CardDetailsForm.tsx    # VENDOR: Payment form component
        ├── CheckoutButton.tsx     # VENDOR: Submit button component
        ├── Success.tsx            # VENDOR: Success page component
        │
        ├── MFA.tsx               # TRUELY: Core MFA integration
        ├── MFAOverlay.tsx        # TRUELY: Loading/status overlay
        ├── MFA_popup.tsx         # TRUELY: MFA method selection
        └── MFA_sms_popup.tsx     # TRUELY: SMS verification UI
```

## Vendor Demo Application

The main application (`App.tsx`) simulates a typical e-commerce checkout flow, showcasing how merchants can integrate TruelyPay's MFA services into their existing payment systems.

### Demo Features

- **Payment Form**: Credit card details, billing information
- **Dynamic Amount**: Configurable transaction amounts for testing
- **Real Payment Flow**: Complete checkout simulation
- **MFA Integration**: Seamless transition to authentication when required
- **Success Handling**: Transaction completion confirmation

### Running the Demo

1. Ensure the backend MFA service is running on `http://localhost:5001`
2. Start the frontend development server
3. Navigate to the payment form
4. Enter transaction details (amounts ≥$100 will trigger MFA)
5. Complete the MFA challenge when prompted

## TruelyPay Integration Components

The **TruelyPay components** are designed for **easy integration** into any existing React application with minimal code changes.

### Core Integration Component: `MFA.tsx`

The primary integration point that handles all MFA logic:

```typescript
import { startMFA } from "./components/MFA";

// Simple integration - just call startMFA with your payment data
const handlePayment = async (paymentData) => {
  try {
    const result = await startMFA({
      merchant_id: "your_merchant_id",
      api_key: "your_api_key",
      amount: paymentData.amount,
      currency: "USD",
      email: paymentData.email,
      // ... other payment details
    });

    if (result.success) {
      // Proceed with payment
      console.log("MFA completed successfully");
    }
  } catch (error) {
    console.error("MFA failed:", error);
  }
};
```

### Integration Components

#### 1. **MFAOverlay** - Status Display

```tsx
import MFAOverlay from "./components/MFAOverlay";

<MFAOverlay visible={mfaPending} message="Processing authentication..." />;
```

#### 2. **MFA Popup Components** - User Interface

The system automatically renders the appropriate MFA UI based on the selected method:

- `MFA_popup.tsx` - Method selection (SMS, Email, Duo)
- `MFA_sms_popup.tsx` - SMS code verification

### Easy Integration Steps

**Step 1**: Copy TruelyPay components to your project

```bash
# Copy these files to your components directory:
# - MFA.tsx
# - MFAOverlay.tsx
# - MFA_popup.tsx
# - MFA_sms_popup.tsx
```

**Step 2**: Import and use in your payment flow

```tsx
import { startMFA } from "./components/MFA";
import MFAOverlay from "./components/MFAOverlay";

// In your payment component
const [mfaPending, setMfaPending] = useState(false);

const handlePayment = async () => {
  setMfaPending(true);

  const result = await startMFA({
    // Your payment data
  });

  setMfaPending(false);

  if (result.success) {
    // Complete payment
  }
};
```

**Step 3**: Add the overlay to your JSX

```tsx
return (
  <div>
    {/* Your existing payment form */}

    <MFAOverlay visible={mfaPending} />
  </div>
);
```

That's it! **Three simple steps** to add enterprise-grade MFA to any payment system.

## Configuration

### Backend Integration

Update the API endpoint in `MFA.tsx` if your backend runs on a different port:

```typescript
// In MFA.tsx, modify the endpoint
const endpoint = options?.endpoint || "http://your-backend-url/authpay/init";
```

### Merchant Configuration

Set your merchant credentials in the startMFA call:

```typescript
await startMFA({
  merchant_id: "your_merchant_id",
  api_key: "your_api_key",
  // ... other data
});
```

## Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# TypeScript compilation check
npm run build

# Code linting
npm run lint

# Production preview
npm run preview
```

### Adding Custom MFA Methods

To add new MFA methods, extend the MFA components:

1. Create new popup component (e.g., `MFA_biometric_popup.tsx`)
2. Add method handling in `MFA.tsx`
3. Update method selection in `MFA_popup.tsx`

### Styling Customization

The components use standard CSS classes that can be customized:

```css
/* Customize MFA overlay appearance */
.mfa-overlay {
  /* Your custom styles */
}

.mfa-spinner {
  /* Custom spinner styles */
}

.mfa-popup {
  /* Custom popup styles */
}
```

## Testing

### Manual Testing Scenarios

1. **Low Amount Transaction** (< $100)

   - Should proceed without MFA
   - Verify direct payment completion

2. **High Amount Transaction** (≥ $100)

   - Should trigger MFA challenge
   - Test SMS verification flow
   - Test email verification flow

3. **Geographic Risk Testing**

   - Use VPN to simulate foreign transactions
   - Verify MFA triggers for high-risk locations

4. **Error Handling**
   - Test invalid verification codes
   - Test expired challenges
   - Test network connectivity issues

### Integration Testing

Test the TruelyPay components in your own application:

1. Copy components to your project
2. Implement basic integration
3. Test with various transaction amounts
4. Verify MFA flow completion
5. Handle success/error cases

## Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# The dist/ folder contains your deployable assets
```

### Environment Configuration

For production deployment, update:

1. **API Endpoints**: Point to production backend URLs
2. **Merchant Credentials**: Use production API keys
3. **CORS Settings**: Configure allowed origins
4. **SSL/HTTPS**: Ensure secure connections

### Hosting Options

The built application can be deployed to:

- **Vercel** - Zero-config deployment
- **Netlify** - Static site hosting
- **AWS S3** + CloudFront - Scalable hosting
- **Traditional Web Servers** - Apache, Nginx

## Browser Support

- **Chrome** 88+
- **Firefox** 85+
- **Safari** 14+
- **Edge** 88+
- **Mobile browsers** - Full responsive support

## License

This project is currently in development and not yet licensed for production use.

For educational and development purposes only.

---

## Support & Integration Help

For technical support integrating TruelyPay components into your application:

1. Review the integration examples in this README
2. Test with the demo application first
3. Check the component source code for detailed implementation
4. Ensure your backend MFA service is properly configured

**Quick Integration Checklist:**

- ✅ Copy TruelyPay components to your project
- ✅ Import `startMFA` function
- ✅ Add `MFAOverlay` to your UI
- ✅ Configure merchant credentials
- ✅ Test with various transaction amounts
- ✅ Handle MFA success/failure cases

```

```

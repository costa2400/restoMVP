# ShiftSwap

A mobile-first application enabling restaurant servers to post, claim, and swap shifts with peer-to-peer coordination while maintaining restaurant management oversight through a simple approval workflow.

## Technology Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Notifications**: Expo Push + Twilio SMS
- **Hosting**: EAS (Expo) + Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account
- Twilio account (for SMS functionality)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Supabase and Twilio credentials in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run migrations:
   ```bash
   supabase db push
   ```
   - Or manually run the SQL files in `supabase/migrations/`

5. Deploy Supabase Edge Functions:
   ```bash
   supabase functions deploy send-push
   supabase functions deploy send-sms
   supabase functions deploy handle-sms
   supabase functions deploy web-approval
   ```

6. Configure Twilio webhook:
   - Set the webhook URL for incoming SMS to: `https://your-project.supabase.co/functions/v1/handle-sms`

7. Start the development server:
```bash
npm start
```

## Project Structure

```
shiftswap/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication flow
│   ├── (tabs)/            # Main app tabs
│   └── shift/[id].tsx     # Shift detail
├── components/            # Reusable components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
└── supabase/
    ├── migrations/       # Database migrations
    └── functions/         # Edge Functions
```

## Key Features

- **Server Onboarding**: Email/password auth with profile setup
- **Restaurant Verification**: Request and receive verification at restaurants
- **Shift Posting**: Post available shifts with date, time, and notes
- **Shift Claiming**: Claim shifts from other servers
- **Manager Approval**: SMS-based approval workflow (no app download required)
- **Real-time Updates**: Live shift feed with Supabase subscriptions
- **Push Notifications**: Get notified about new shifts and approvals

## Database Schema

- `users`: User profiles and authentication
- `restaurants`: Restaurant information
- `verifications`: Many-to-many relationship between users and restaurants
- `shifts`: Shift postings with status tracking
- `notifications`: In-app notifications

## Security

- Row Level Security (RLS) policies enforce access control
- Servers can only see shifts at verified restaurants
- Only managers can approve/deny shifts
- All API calls are authenticated via Supabase Auth

## Deployment

### Mobile Apps

1. Build with EAS:
```bash
eas build --platform ios
eas build --platform android
```

2. Submit to stores:
```bash
eas submit --platform ios
eas submit --platform android
```

### Edge Functions

Deploy all functions:
```bash
supabase functions deploy send-push
supabase functions deploy send-sms
supabase functions deploy handle-sms
supabase functions deploy web-approval
```

## License

Private - All rights reserved

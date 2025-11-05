# Creator Split Paywall

A decentralized paywall system that allows content creators to split their earnings automatically using smart contracts.

## Project Structure

- `contracts/`: Solidity smart contracts using Hardhat and OpenZeppelin
- `backend/`: NestJS backend service with webhooks, roles, PostgreSQL, and Redis
- `analytics/`: Python analytics service using Celery for anomaly detection
- `infra/`: Infrastructure related files including database initialization

## Getting Started

1. Copy `.env.example` to `.env` and fill in your configuration
2. Start the services:
   ```bash
   docker-compose up
   ```

## Development

### Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Analytics
```bash
cd analytics
pip install -r requirements.txt
python celery_app.py
```

## Features

- Subscription management with automatic revenue splitting
- Role-based access control
- Real-time analytics and anomaly detection
- Blockchain event monitoring
- Automated payment distribution

## Testing

Each component has its own test suite. Run them individually:

```bash
# Smart contracts
cd contracts && npm test

# Backend
cd backend && npm test

# Analytics
cd analytics && python -m pytest
```

## License

MIT
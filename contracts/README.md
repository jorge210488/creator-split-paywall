# Contracts

UUPS-upgradeable Subscription Split Paywall built with Hardhat and OpenZeppelin Upgrades.

## What lives here

- `contracts/SubscriptionSplitPaywall.sol` – core logic (upgrade-safe)
- `scripts/deploy.ts` – deploys UUPS proxy
- `scripts/verify.ts` – verifies implementation and (optionally) proxy on Etherscan
- `deployments/sepolia.json` – source of truth for deployed addresses

## Run tests

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## Deploy (Sepolia)

```bash
# Ensure ETH_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY exist in .env
npx hardhat run scripts/deploy.ts --network sepolia
# optional: verify (implementation)
npx hardhat run scripts/verify.ts --network sepolia
```

## Upgrade (UUPS)

Storage layout must be preserved (append-only). Suggested flow:

1. Implement changes in `SubscriptionSplitPaywall.sol` without reordering/removing storage slots.
2. `npx hardhat test` and review coverage.
3. Upgrade the proxy:
   ```js
   // Hardhat console or new script
   const proxy = "0x5c617e061C00385Cc320E9a1Bcb9B2C433B213C9"; // current proxy
   const NewImpl = await ethers.getContractFactory("SubscriptionSplitPaywall");
   await upgrades.upgradeProxy(proxy, NewImpl);
   ```
4. `npx hardhat run scripts/verify.ts --network sepolia` to verify implementation.
5. Update `deployments/sepolia.json` with the new implementation address.

## Regenerate ABI for the backend

After any contract change:

```bash
npx hardhat compile
# Copy the ABI JSON to the backend
cp artifacts/contracts/SubscriptionSplitPaywall.sol/SubscriptionSplitPaywall.json \
  ../backend/src/blockchain/abi/subscription.abi.json
```

## Troubleshooting

- Proxy address not found: ensure `deploy.ts` printed the proxy and commit it to `deployments/sepolia.json`.
- Verification fails: check `ETHERSCAN_API_KEY` and that the bytecode matches compilation settings.
- Upgrade reverts: likely storage layout issue; compare storage using `@openzeppelin/upgrades-core` and keep gaps.

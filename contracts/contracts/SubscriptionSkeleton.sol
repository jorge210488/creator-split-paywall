// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract SubscriptionSkeleton is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    
    struct Subscription {
        uint256 price;
        uint256 duration;
        address[] beneficiaries;
        uint256[] shares;
        bool active;
    }

    uint256 private _subscriptionCounter;
    
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256) public userSubscriptions;
    mapping(address => uint256) public lastAccessTime;

    event SubscriptionCreated(uint256 indexed subscriptionId, uint256 price, uint256 duration);
    event SubscriptionPurchased(address indexed user, uint256 indexed subscriptionId);
    event PaymentDistributed(uint256 indexed subscriptionId, uint256 amount);

    error InvalidPrice();
    error InvalidDuration();
    error InvalidShares();
    error SubscriptionNotFound();
    error InvalidPayment();
    error SubscriptionExpired();
    error NotSubscribed();
    error AlreadySubscribed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }

        function createSubscription(
            uint256 price,
            uint256 duration,
            address[] calldata beneficiaries,
            uint256[] calldata shares
        ) external onlyRole(CREATOR_ROLE) returns (uint256) {
            if (price == 0) revert InvalidPrice();
            if (duration == 0) revert InvalidDuration();
            if (beneficiaries.length == 0 || beneficiaries.length != shares.length) revert InvalidShares();
        
            uint256 totalShares;
            for (uint256 i = 0; i < shares.length; i++) {
                totalShares += shares[i];
            }
            if (totalShares != 100) revert InvalidShares();

            uint256 subscriptionId = _subscriptionCounter++;
            subscriptions[subscriptionId] = Subscription({
                price: price,
                duration: duration,
                beneficiaries: beneficiaries,
                shares: shares,
                active: true
            });

            emit SubscriptionCreated(subscriptionId, price, duration);
            return subscriptionId;
        }

        function purchase(uint256 subscriptionId) external payable whenNotPaused {
            Subscription storage sub = subscriptions[subscriptionId];
            if (!sub.active) revert SubscriptionNotFound();
            if (msg.value != sub.price) revert InvalidPayment();
            if (userSubscriptions[msg.sender] != 0) revert AlreadySubscribed();

            userSubscriptions[msg.sender] = subscriptionId;
            lastAccessTime[msg.sender] = block.timestamp;

            uint256 remaining = msg.value;
            for (uint256 i = 0; i < sub.beneficiaries.length; i++) {
                uint256 payment = (msg.value * sub.shares[i]) / 100;
                remaining -= payment;
                payable(sub.beneficiaries[i]).transfer(payment);
            }
        
            // Transfer any remaining dust (due to rounding) to the last beneficiary
            if (remaining > 0) {
                payable(sub.beneficiaries[sub.beneficiaries.length - 1]).transfer(remaining);
            }

            emit SubscriptionPurchased(msg.sender, subscriptionId);
        }

        function hasValidSubscription(address user) public view returns (bool) {
            uint256 subId = userSubscriptions[user];
            if (subId == 0) return false;
        
            Subscription storage sub = subscriptions[subId];
            if (!sub.active) return false;

            return block.timestamp < lastAccessTime[user] + sub.duration;
        }

        function cancelSubscription(uint256 subscriptionId) external onlyRole(CREATOR_ROLE) {
            if (!subscriptions[subscriptionId].active) revert SubscriptionNotFound();
            subscriptions[subscriptionId].active = false;
        }

        function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
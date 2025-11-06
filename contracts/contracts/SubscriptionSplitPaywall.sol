// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @title SubscriptionSplitPaywall
 * @dev Upgrade-safe UUPS subscription paywall with PaymentSplitter pull-pay model.
 */
contract SubscriptionSplitPaywall is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PaymentSplitterUpgradeable,
    PausableUpgradeable
{
    uint256 public subscriptionPrice;
    uint256 public subscriptionDuration;
    mapping(address => uint256) public subscriptionExpiry;

    event SubscriptionStarted(address indexed subscriber, uint256 expiry, uint256 amount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event DurationUpdated(uint256 oldDuration, uint256 newDuration);
    event TipReceived(address indexed from, uint256 amount);

    error AlreadyActiveSubscription();
    error InsufficientPayment();
    error InvalidPrice();
    error InvalidDuration();
    error InvalidPayees();
    error InvalidShares();

    uint256[45] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] calldata payees,
        uint256[] calldata shares,
        uint256 _price,
        uint256 _duration
    ) public initializer {
        if (payees.length == 0 || payees.length != shares.length) revert InvalidPayees();

        __Ownable_init();
        __UUPSUpgradeable_init();
        __PaymentSplitter_init(payees, shares);
        __Pausable_init();

        if (_price == 0) revert InvalidPrice();
        if (_duration == 0) revert InvalidDuration();

        subscriptionPrice = _price;
        subscriptionDuration = _duration;
    }

    function subscribe() external payable whenNotPaused {
        if (block.timestamp < subscriptionExpiry[msg.sender]) revert AlreadyActiveSubscription();
        if (msg.value < subscriptionPrice) revert InsufficientPayment();

        uint256 periodsPaid = msg.value / subscriptionPrice;
        if (periodsPaid == 0) revert InsufficientPayment();

        uint256 newExpiry = block.timestamp + (periodsPaid * subscriptionDuration);
        subscriptionExpiry[msg.sender] = newExpiry;

        emit SubscriptionStarted(msg.sender, newExpiry, msg.value);
    }

    function isActive(address user) public view returns (bool) {
        return subscriptionExpiry[user] > block.timestamp;
    }

    function setSubscriptionPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();
        uint256 old = subscriptionPrice;
        subscriptionPrice = newPrice;
        emit PriceUpdated(old, newPrice);
    }

    function setSubscriptionDuration(uint256 newDuration) external onlyOwner {
        if (newDuration == 0) revert InvalidDuration();
        uint256 old = subscriptionDuration;
        subscriptionDuration = newDuration;
        emit DurationUpdated(old, newDuration);
    }

    function releasableAmount(address account) public view returns (uint256) {
        uint256 totalReceived = address(this).balance + totalReleased();
        uint256 _shares = shares(account);
        uint256 _totalShares = totalShares();
        uint256 _alreadyReleased = released(account);

        if (_totalShares == 0 || _shares == 0) return 0;

        uint256 payment = (totalReceived * _shares) / _totalShares;
        if (payment <= _alreadyReleased) return 0;
        return payment - _alreadyReleased;
    }

    receive() external payable virtual override {
        emit TipReceived(msg.sender, msg.value);
    }

    // PaymentSplitterUpgradeable does not declare a `fallback()` to override in some OZ versions,
    // so do not use `override` here to avoid compilation errors.
    fallback() external payable virtual {
        emit TipReceived(msg.sender, msg.value);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

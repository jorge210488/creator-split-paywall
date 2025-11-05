CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    contract_id VARCHAR(42) NOT NULL,
    price DECIMAL NOT NULL,
    duration INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE beneficiaries (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id),
    address VARCHAR(42) NOT NULL,
    share INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    subscription_id INTEGER REFERENCES subscriptions(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_contract_id ON subscriptions(contract_id);
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_address);
CREATE INDEX idx_beneficiaries_subscription ON beneficiaries(subscription_id);
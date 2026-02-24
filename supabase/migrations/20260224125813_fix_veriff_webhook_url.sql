UPDATE identity_verification_provider_configs
SET webhook_url = 'https://app.tupatrimonio.app/api/webhooks/veriff'
WHERE webhook_url = 'https://tupatrimonio.com/api/webhooks/veriff';

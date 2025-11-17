/**
 * Example: Create API Key
 * Demonstrates how to generate and register a new API key for an account
 */

import { SignerClient, ApiClient, AccountApi } from '../src';
import dotenv from 'dotenv';

dotenv.config();

async function createApiKey() {
  console.log('🔑 Creating API Key...\n');

  try {
    // Validate required environment variables

    const apiKey = process.env['API_PRIVATE_KEY'] || '';
    const ethPrivateKey = process.env['ETH_PRIVATE_KEY'] || '';

    const accountIndex = 436063;
    const apiKeyIndex = 11;
    const newApiKeyIndex = 11;
    const baseUrl = 'https://mainnet.zklighter.elliot.ai';

    // Initialize signer client with existing credentials
    console.log('🔧 Initializing SignerClient...');
    const tempSignerClient = new SignerClient({
      url: baseUrl,
      privateKey: apiKey,
      accountIndex,
      apiKeyIndex: apiKeyIndex,
    });

    // await signerClient.initialize();
    // await signerClient.ensureWasmClient();
    console.log('✅ SignerClient initialized successfully!\n');

    // Generate a new API key pair
    console.log('🔐 Generating new API key pair...');
    const apiKeyPair = await tempSignerClient.generateAPIKey();

    if (!apiKeyPair) {
      throw new Error('Failed to generate API key pair');
    }

    console.log('✅ API key pair generated successfully!');
    console.log(`   Private Key: ${apiKeyPair.privateKey}`);
    console.log(`   Public Key: ${apiKeyPair.publicKey}\n`);

    const signerClient = new SignerClient({
      url: baseUrl,
      privateKey: apiKeyPair.privateKey,
      accountIndex,
      apiKeyIndex: apiKeyIndex,
    });
    await signerClient.initialize();
    await signerClient.ensureWasmClient();

    // Register the new API key
    console.log(`📝 Registering new API key (index: ${newApiKeyIndex})...`);
    const [txHash, txInfo, error] = await signerClient.changeApiKey({
      ethPrivateKey,
      newPubkey: apiKeyPair.publicKey,
      newApiKeyIndex: newApiKeyIndex,
    });

    console.log({ txHash, txInfo, error });

    if (error) {
      throw new Error(`Failed to register API key: ${error}`);
    }

    console.log('✅ API key registered successfully!');
    console.log(`   Transaction Hash: ${txInfo}`);
    console.log(`   New API Key Index: ${newApiKeyIndex}\n`);

    // Verify the new API key by fetching API keys
    console.log('🔍 Verifying new API key...');
    const apiClient = new ApiClient({ host: baseUrl });
    const accountApi = new AccountApi(apiClient);

    try {
      const authToken = await signerClient.createAuthTokenWithExpiry(600);
      const apiKeys = await accountApi.getApiKeys(accountIndex, newApiKeyIndex);
      console.log('✅ API key verification successful!');
      console.log(`   Total API keys: ${apiKeys.api_keys.length}`);
      apiKeys.api_keys.forEach((key) => {
        console.log(
          `   - Index ${key.index}: ${key.name || 'Unnamed'} (created: ${key.created_at})`
        );
      });
    } catch (error) {
      console.log('⚠️ Could not verify API key (may need to wait for transaction confirmation)');
    }

    console.log('\n🎉 API key creation completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Account Index: ${accountIndex}`);
    console.log(`   New API Key Index: ${newApiKeyIndex}`);
    console.log(`   Private Key: ${apiKeyPair.privateKey}`);
    console.log(`   Public Key: ${apiKeyPair.publicKey}`);
    console.log(`   Transaction Hash: ${txInfo}`);
    console.log('\n⚠️  IMPORTANT: Save the private key securely! It cannot be recovered.');
  } catch (error) {
    console.error('❌ Error creating API key:', error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  createApiKey().catch(console.error);
}

export { createApiKey };

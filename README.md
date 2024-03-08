# Incogames Test Instructions

Follow these steps to set up your environment and run tests for the Incogames contract:

### Step 1: Deploy Contract

### Step 2: Votes
1. Addr1 votes `00001111`
2. Addr2 votes `00001111`
3. Addr3 votes `11110000`
4. Addr4 votes `11110000`
5. Addr5 votes `00111100`

### Step 3: Result bit should be: `00111100`

### Step 4: Win Check
Each address will call `winCheck`; the winner should be Addr5.

### Step 5: Pay Winners
The `payWinners` function will pay to Addr5.

## Run Test

Here's a detailed guide to prepare your environment for testing the contract:

1. **Install Truffle**: If Truffle is not already installed, use npm to install it globally:

    ```
    npm install -g truffle
    ```

2. **Set Up Test Network Configuration**: Modify your `truffle-config.js` to include a configuration for the test network:

    ```javascript
    const HDWalletProvider = require('@truffle/hdwallet-provider');
    const infuraKey = "your-infura-api-key";
    const privateKey = "your-private-key";

    module.exports = {
       networks: {
         inco: { // This should be the correct config name for your case
           provider: () => new HDWalletProvider(privateKey, `https://testnet.inco.org`),
           network_id: "*", // Use '*' to match any network id or specify an exact one
           gas: 5500000,
           gasPrice: 10000000000,
           confirmations: 2,
         },
         // ... other network configs
       },
       // ... other config options
    };
    ```

    - Ensure you replace `your-infura-api-key` and `your-private-key` with actual values.

3. **Create an Account**: Create a test account and acquire some test Inco tokens from a faucet if they are needed for making transactions.

4. **Deploy Contracts**: Compile and migrate the contracts to the Inco test network:

    ```
    truffle compile
    truffle migrate --network inco
    ```

5. **Write Test Scripts**: Place your test scripts in the `test` directory. Make sure your scripts are compatible with Mocha and Chai frameworks, as Truffle uses them for testing.

6. **Run Tests**: Execute the tests using the command below:

    ```
    truffle test --network inco
    ```

    This command will execute your tests on the Inco test network, ensuring your smart contract behaves as expected.

Make sure to adjust any specific parameters or configurations based on the actual requirements of the Incogames contract and the Inco network environment.
# incogames

## test 

1. Deploy contract
2. Votes 
    2.1 Addr1 vote 00001111
    2.2 Addr1 vote 00001111
    2.3 Addr3 vote 11110000
    2.4 Addr4 vote 11110000
    2.5 Addr5 vote 00111100
3. result bit should be: 00111100
4. each address will call winCheck, winner should be Addr5
5. payWinners will pay to Addr5

## Run test
Here's a step-by-step guide to correctly set up your environment to test the contract:



Install Truffle: If you haven't installed Truffle, install it globally with npm:


   npm install -g truffle


Set Up Test Network Configuration: Ensure your truffle-config.js file has an entry for the test network (I'm treating Inco as a generic Ethereum-compatible network for illustration):


   const HDWalletProvider = require('@truffle/hdwallet-provider');
   const infuraKey = "your-infura-api-key";
   const privateKey = "your-private-key";

   module.exports = {
     networks: {
       inco: { // Ensure this is the correct config name for your case
         provider: () => new HDWalletProvider(privateKey, `https://testnet.inco.org`),
         network_id: "*", // Use '*' for matching any network id or specify the correct one
         gas: 5500000,
         gasPrice: 10000000000,
         confirmations: 2,
       },
       // ... other network configs
     },
     // ... other config options
   };


Create an Account: If you haven't done this already, create a test account and get some test Inco tokens from a faucet if they are required for transactions.


Deploy Contracts: Compile and migrate your contracts to the Inco test network:



   truffle compile
   truffle migrate --network inco


Write Test Scripts: Your test script should be in the test directory and should be written in a way compatible with Mocha and Chai, as these are the frameworks that Truffle uses for testing. Your provided test script looks adequate, but remember to update infuraKey and privateKey with your actual data, and make sure your HDWalletProvider is configured correctly.


Run Tests: Execute the tests on the configured network:



   truffle test --network inco

This process will run your tests on the Inco test network. Adjustments may be necessary depending on the network's specific requirements and API compatibility.


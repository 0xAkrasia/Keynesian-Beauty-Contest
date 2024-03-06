const HDWalletProvider = require('@truffle/hdwallet-provider');
   const infuraKey = "your-infura-api-key";
   const mnemoic = "";

   module.exports = {
     networks: {
       inco: {
        provider: () => new HDWalletProvider(mnemoic, `https://testnet.inco.org`),
        network_id: 9090,
        gas: 5500000,
        gasPrice: 15000000,
        confirmations: 2,
      },
     },
     compilers: {
      solc: {
        version: "0.8.20", // Set the version to one in the required range
        // other solc settings like optimizer settings can go here
      }
    }
   };

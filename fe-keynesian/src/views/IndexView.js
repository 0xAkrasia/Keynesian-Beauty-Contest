/* eslint-disable */

import React from 'react'
import { createScope, map, transformProxies } from './helpers'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import { initFhevm, createInstance } from "fhevmjs"
import { BrowserProvider, Contract } from 'ethers';
import { AbiCoder } from 'ethers';
import contractAbi from '../abi/KeynsianBeautyContest.json';

// Initiate wallet modal
const scripts = [
  { loading: fetch("https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=65f8d5e4ed1fa366d79954b8").then(body => body.text()), isAsync: false },
  { loading: fetch("js/webflow.js").then(body => body.text()), isAsync: false },
]

let Controller

const projectId = '2306be42fa635e4c7f57e5002e25f088';

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
};

const polygon = {
  chainId: 137,
  name: 'Polygon',
  currency: 'MATIC',
  explorerUrl: 'https://polygonscan.com/',
  rpcUrl: 'https://polygon-rpc.com/'
}

const bsc = {
  chainId: 56,
  name: 'BSC',
  currency: 'BNB',
  explorerUrl: 'https://polygonscan.com/',
  rpcUrl: 'https://bscscan.com/'
}

const inco = {
  chainId: 9090,
  name: 'INCO Testnet',
  currency: 'INCO',
  explorerUrl: 'https://explorer.testnet.inco.org',
  rpcUrl: 'https://testnet.inco.org'
}

const metadata = {
  name: 'Crypti Talk',
  description: 'Decentralized AI and Advertisible NFT',
  url: 'https://app.cryptitalk.com',
  icons: ['https://storage.googleapis.com/cryptitalk/cryptitalk.png']
};

const modal = createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [mainnet, polygon, bsc, inco],
  projectId
});

initFhevm()

let instance;

class IndexView extends React.Component {

  constructor(props) {
    super(props);

    // Initialize the state with an empty set for selected images
    this.state = {
      selectedImages: new Set(),
      countdownTime: 12 * 3600 + 23 * 60 + 41,
    };

    this.handleImageClick = this.handleImageClick.bind(this);
    this.tick = this.tick.bind(this);
  }

  handleImageClick(imageId) {
    this.setState(prevState => {
      const newSelectedImages = new Set(prevState.selectedImages);

      if (newSelectedImages.has(imageId)) {
        newSelectedImages.delete(imageId); // Deselect if already selected
      } else if (newSelectedImages.size < 4) {
        newSelectedImages.add(imageId); // Select if less than 4 are selected already
      }

      return { selectedImages: newSelectedImages };
    });
  }

  convertToUint8(selectedImageIdsArray) {
    let result = 0; // Initialize the result as a number with all bits set to 0.

    // Assuming image IDs start at 1 and go up to 8.
    selectedImageIdsArray.forEach((id) => {
      if (id >= 1 && id <= 8) {
        result |= 1 << (id - 1); // Set the bit corresponding to the image ID.
      } else {
        throw new Error('Image ID is out of range. It should be between 1 and 8, inclusive.');
      }
    });

    return result;
  }

  async handleBet(event) {
    event.preventDefault();

    
    try {
      const walletProvider = await modal.getWalletProvider();
      const web3Provider = new BrowserProvider(walletProvider);

      // Initiate FHE
      const FHE_LIB_ADDRESS = "0x000000000000000000000000000000000000005d";
      const network = await web3Provider.getNetwork();
      const chainId = +network.chainId.toString();
      const ret = await web3Provider.call({
        to: FHE_LIB_ADDRESS,
        data: "0xd9d47bb001",
      });
      const decoded = AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
      const publicKey = decoded[0];
      instance = await createInstance({ chainId, publicKey });
      console.log("FHE instance created", instance);

      const signer = await web3Provider.getSigner();
      console.log('Signer:', signer);

      // Define the contract ABI and address
      const contractAddress = '0x04eDd932fDc43Bb14861462Fd9ab9fab4C3a6c2c';

      const contract = new Contract(contractAddress, contractAbi, signer);
      const selectedImageIdsArray = Array.from(this.state.selectedImages);
      const voteUint8 = this.convertToUint8(selectedImageIdsArray);
      const encryptedVote = instance.encrypt8(voteUint8);
      const tx = await contract.castVote(encryptedVote);
      await tx.wait();
      alert('Vote cast successfully');
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Failed to cast vote');
    }
  }


  renderImageItems() {
    const imageIds = ['img', 'img_1', 'img_2', 'img_3', 'img_4', 'img_5', 'img_6', 'img_7'];
    return imageIds.map(id => {
      const isSelected = this.state.selectedImages.has(id);
      const imageClassName = `af-class-item${isSelected ? ' af-class-selected' : ''}`;
      const imagePath = `images/${id}.png`;

      return (
        <div key={id} className={imageClassName} onClick={() => this.handleImageClick(id)}>
          <img src={imagePath} loading="lazy" width={211} height={211} alt="" className="af-class-img" />
        </div>
      );
    });
  }

  static get Controller() {
    if (Controller) return Controller

    try {
      Controller = require('../controllers/IndexController')
      Controller = Controller.default || Controller

      return Controller
    }
    catch (e) {
      if (e.code == 'MODULE_NOT_FOUND') {
        Controller = IndexView

        return Controller
      }

      throw e
    }
  }

  componentDidMount() {
    const htmlEl = document.querySelector('html')
    htmlEl.dataset['wfPage'] = '65f8d5e4ed1fa366d79954e6'
    htmlEl.dataset['wfSite'] = '65f8d5e4ed1fa366d79954b8'
    this.countdownTimer = setInterval(this.tick, 1000);

    scripts.concat(null).reduce((active, next) => Promise.resolve(active).then((active) => {
      const loading = active.loading.then((script) => {
        new Function(`
          with (this) {
            eval(arguments[0])
          }
        `).call(window, script)

        return next
      })

      return active.isAsync ? next : loading
    }))
  }

  componentWillUnmount() {
    // Clear the countdown interval to prevent memory leaks
    clearInterval(this.countdownTimer);
  }

  tick() {
    this.setState(prevState => ({
      countdownTime: Math.max(prevState.countdownTime - 1, 0),
    }));
  }

  renderCountdown() {
    const { countdownTime } = this.state;
    const hours = Math.floor(countdownTime / 3600);
    const minutes = Math.floor((countdownTime % 3600) / 60);
    const seconds = countdownTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  render() {
    const proxies = IndexView.Controller !== IndexView ? transformProxies(this.props.children) : {

    }

    return (
      <span>
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url(/css/normalize.css);
          @import url(/css/webflow.css);
          @import url(/css/melee.webflow.css);
        ` }} />
        <span className="af-view">
          <div className="af-class-body">
            <div className="af-class-game-container">
              <div className="af-class-header w-clearfix">
                <div className="af-class-button-container">
                  <w3m-button label="Connect" balance="hide" size="sm">Connect</w3m-button>
                </div>
              </div>
              <div className="af-class-game-header">
                <div className="af-class-game-title">
                  <div className="af-class-h1">Keynesian contest </div>
                  <div className="af-class-p_body">You are rewarded for selecting the most popular faces among all participants.</div>
                </div>
                <div className="af-class-game-stats">
                  <div className="af-class-typehead">
                    <div className="af-class-p_body">Total Pot</div>
                    <div className="af-class-h2">$40,000,000</div>
                  </div>
                  <div className="af-class-typehead">
                    <div className="af-class-p_body">Time to reveal</div>
                    <div className="af-class-h2">{this.renderCountdown()}</div>
                  </div>
                </div>
              </div>
              <div className="af-class-bet-input">
                <div className="af-class-form-block w-form">
                  <form id="wf-form-amount" name="wf-form-amount" data-name="amount" method="get" className="af-class-form" onSubmit={this.handleBet.bind(this)}>
                    <input type="submit" data-wait="Please wait..." className="af-class-submit-button w-button" value="Bet" />
                  </form>
                </div>
              </div>
              <div className="w-layout-vflex af-class-flex-block">
                <div className="af-class-p_body">Select 4 faces to bet</div>
                <div className="af-class-selection-grid">
                  {this.renderImageItems()}
                </div>
              </div>
            </div>
          </div>
        </span>
      </span>
    )
  }
}

export default IndexView

/* eslint-enable */
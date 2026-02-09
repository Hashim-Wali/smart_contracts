console.log("script.js loaded");

let provider;
let signer;
let contract;
let userAddress;

const CONTRACT_ADDRESS = "0x0512B0834CA239Ccb2B64D36fc190dcA482e1c14";
const ABI_PATH = "./abi/MyToken.json";

/* ---------- Helpers ---------- */

async function loadABI() {
  const response = await fetch(ABI_PATH);
  return await response.json();
}

function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}

/* ---------- Token Data ---------- */

async function loadTokenData() {
  const name = await contract.name();
  const symbol = await contract.symbol();
  const totalSupply = await contract.totalSupply();
  const balance = await contract.balanceOf(userAddress);

  document.getElementById("tokenName").innerText = name;
  document.getElementById("tokenSymbol").innerText = symbol;
  document.getElementById("totalSupply").innerText =
    ethers.formatUnits(totalSupply, 18);
  document.getElementById("balance").innerText =
    ethers.formatUnits(balance, 18);
}

/* ---------- Wallet ---------- */

async function connectWallet() {
  console.log("Connect wallet clicked");

  if (!window.ethereum) {
    console.log("No window.ethereum");
    alert("MetaMask not found");
    return;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log("Accounts:", accounts);

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    console.log("User address:", userAddress);

    const network = await provider.getNetwork();
    console.log("Network:", network);
    const chainId = Number(network.chainId);
    console.log("Chain ID:", chainId);

    if (chainId !== 11155111) {
      console.log("Trying to switch to Sepolia");
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } catch (err) {
        console.error("Network switch failed:", err);
        alert("Please switch MetaMask to Sepolia");
        return;
      }
    }

    const abi = await loadABI();
    console.log("ABI loaded in connectWallet");

    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    console.log("Contract created:", contract);

    document.getElementById("wallet").innerText = userAddress;
    document.getElementById("network").innerText = "Sepolia";
    document.getElementById("walletInfo").classList.remove("hidden");

    await loadTokenData();
    await checkOwner();

    setStatus("Wallet connected");
    console.log("Wallet connected OK");
  } catch (err) {
    console.error("connectWallet error:", err);
    alert("Wallet connection failed. Check console.");
  }
}

/* ---------- Owner check ---------- */

async function checkOwner() {
  const owner = await contract.owner();
  if (owner.toLowerCase() === userAddress.toLowerCase()) {
    document.querySelector(".owner-only").classList.remove("hidden");
  }
}

/* ---------- Actions ---------- */

async function transferTokens() {
  const to = document.getElementById("toAddress").value;
  const amount = document.getElementById("transferAmount").value;

  const tx = await contract.transfer(to, ethers.parseUnits(amount, 18));
  await tx.wait();

  setStatus("Transfer successful");
  loadTokenData();
}

async function burnTokens() {
  const amount = document.getElementById("burnAmount").value;

  const tx = await contract.burn(ethers.parseUnits(amount, 18));
  await tx.wait();

  setStatus("Tokens burned");
  loadTokenData();
}

async function mintTokens() {
  const to = document.getElementById("mintTo").value;
  const amount = document.getElementById("mintAmount").value;

  const tx = await contract.mint(to, ethers.parseUnits(amount, 18));
  await tx.wait();

  setStatus("Mint successful");
  loadTokenData();
}

async function pause() {
  const tx = await contract.pause();
  await tx.wait();
  setStatus("Contract paused");
}

async function unpause() {
  const tx = await contract.unpause();
  await tx.wait();
  setStatus("Contract unpaused");
}

/* ---------- Event Listeners ---------- */

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  document
    .getElementById("connectBtn")
    ?.addEventListener("click", connectWallet);
  document
    .getElementById("transferBtn")
    ?.addEventListener("click", transferTokens);
  document
    .getElementById("burnBtn")
    ?.addEventListener("click", burnTokens);
  document
    .getElementById("mintBtn")
    ?.addEventListener("click", mintTokens);
  document
    .getElementById("pauseBtn")
    ?.addEventListener("click", pause);
  document
    .getElementById("unpauseBtn")
    ?.addEventListener("click", unpause);
});


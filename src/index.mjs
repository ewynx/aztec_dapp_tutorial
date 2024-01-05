import {
  ExtendedNote,
  Fr,
  L2BlockL2Logs,
  Note,
  computeMessageSecretHash,
  createPXEClient,
  getSandboxAccountsWallets,
} from '@aztec/aztec.js';
import { fileURLToPath } from '@aztec/foundation/url';

import { getToken } from './contracts.mjs';

import express from 'express';
import cors from 'cors';

const { PXE_URL = 'http://localhost:8080' } = process.env;
let pxe = null;

const app = express();
const corsOptions = {
  origin: 'http://localhost:4001',
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));
app.get("/start", async function(req, res) {
  console.log("request start");

  try {
    pxe = createPXEClient(PXE_URL);
    const { chainId } = await pxe.getNodeInfo();
    console.log(`Connected to chain ${chainId}`);

    res.json("Connected"); 
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});

app.get("/show_accounts", async function(req, res) {
  console.log("request show_accounts");

  try {
    await showAccounts(pxe);

    res.json("Accounts showed");
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});



const port = process.env.PORT || 3001;
app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});

async function showAccounts(pxe) {
  const accounts = await pxe.getRegisteredAccounts();
  console.log(`User accounts:\n${accounts.map(a => a.address).join('\n')}`);
}

async function showPrivateBalances(pxe) {
  const accounts = await pxe.getRegisteredAccounts();
  // E: this only "fetches" the contract, it has already been deployed with the deploy script
  const token = await getToken(pxe);

  for (const account of accounts) {
    // E: Source https://docs.aztec.network/dev_docs/tutorials/writing_dapp/contract_interaction#showing-user-balance
    // E: Note that this function will only return a valid response for accounts registered in the Private eXecution Environment (PXE), since it requires access to the user's private state. In other words, you cannot query the private balance of another user for the token contract.
    const balance = await token.methods.balance_of_private(account.address).view();
    console.log(`Balance of ${account.address}: ${balance}`);
  }
}

async function mintPrivateFunds(pxe) {
  const [owner] = await getSandboxAccountsWallets(pxe);
  const token = await getToken(owner);

  await showPrivateBalances(pxe);

  const mintAmount = 20n;
  const secret = Fr.random();
  // E: returns hash
  const secretHash = await computeMessageSecretHash(secret);
  // E: upon contract construction, the owner is set to be both admin and initial minter
  const receipt = await token.methods.mint_private(mintAmount, secretHash).send().wait();

  // E: apparently you gave to know in what storage slot of the contract the note is stored
  const storageSlot = new Fr(5);
  const note = new Note([new Fr(mintAmount), secretHash]);
  const extendedNote = new ExtendedNote(note, owner.getAddress(), token.address, storageSlot, receipt.txHash);
  
  // E: locally (in the PXE) you'll need to keep track of the notes.
  // Although this doesn't seem to be used in the rest of the code
  // https://github.com/AztecProtocol/aztec-packages/blob/aztec-packages-v0.16.9/yarn-project/end-to-end/src/sample-dapp/index.mjs#L50
  await pxe.addNote(extendedNote);

  // E: the `#[aztec(private)]` attribute on the function refers to the function using private data 
  await token.methods.redeem_shield(owner.getAddress(), mintAmount, secret).send().wait();

  await showPrivateBalances(pxe);
}

async function transferPrivateFunds(pxe) {
  // docs:start:transferPrivateFunds
  const [owner, recipient] = await getSandboxAccountsWallets(pxe);
  // E: gets the custom Contract
  const token = await getToken(owner);

  const tx = token.methods.transfer(owner.getAddress(), recipient.getAddress(), 1n, 0).send();
  console.log(`Sent transfer transaction ${await tx.getTxHash()}`);
  await showPrivateBalances(pxe);

  console.log(`Awaiting transaction to be mined`);
  const receipt = await tx.wait();
  console.log(`Transaction has been mined on block ${receipt.blockNumber}`);
  await showPrivateBalances(pxe);
  // docs:end:transferPrivateFunds
}

async function showPublicBalances(pxe) {
  // docs:start:showPublicBalances
  const accounts = await pxe.getRegisteredAccounts();
  const token = await getToken(pxe);

  for (const account of accounts) {
    // highlight-next-line:showPublicBalances
    const balance = await token.methods.balance_of_public(account.address).view();
    console.log(`Balance of ${account.address}: ${balance}`);
  }
  // docs:end:showPublicBalances
}

async function mintPublicFunds(pxe) {
  // docs:start:mintPublicFunds
  const [owner] = await getSandboxAccountsWallets(pxe);
  const token = await getToken(owner);

  const tx = token.methods.mint_public(owner.getAddress(), 100n).send();
  console.log(`Sent mint transaction ${await tx.getTxHash()}`);
  await showPublicBalances(pxe);

  console.log(`Awaiting transaction to be mined`);
  const receipt = await tx.wait();
  console.log(`Transaction has been mined on block ${receipt.blockNumber}`);
  await showPublicBalances(pxe);
  // docs:end:mintPublicFunds

  // docs:start:showLogs
  const blockNumber = await pxe.getBlockNumber();
  const logs = (await pxe.getUnencryptedLogs(blockNumber, 1)).logs;
  const textLogs = logs.map(extendedLog => extendedLog.log.data.toString('ascii'));
  for (const log of textLogs) console.log(`Log emitted: ${log}`);
  // docs:end:showLogs
}

async function main() {
  // const pxe = createPXEClient(PXE_URL);
  // const { chainId } = await pxe.getNodeInfo();
  // console.log(`Connected to chain ${chainId}`);

  // await showAccounts(pxe);

  // await mintPrivateFunds(pxe);

  // await transferPrivateFunds(pxe);

  // await mintPublicFunds(pxe);
}

if (process.argv[1].endsWith('index.mjs')) {
  main().catch(err => {
    console.error(`Error in app: ${err}`);
    process.exit(1);
  });
}

export { main };
// src/contracts.mjs
import { AztecAddress, Contract } from '@aztec/aztec.js';
import { readFileSync } from "fs";
import TokenContractArtifact from "../contracts/token/target/Token.json" assert { type: "json" };

export async function getToken(client) {
  const addresses = JSON.parse(readFileSync('addresses.json'));
  return Contract.at(AztecAddress.fromString(addresses.token), TokenContractArtifact, client);
}
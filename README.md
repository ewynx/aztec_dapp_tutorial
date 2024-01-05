# Aztec Token dApp example

A working dApp example, created using bits and pieces of https://docs.aztec.network/dev_docs/tutorials/writing_dapp/main. It's not cleaned up and is only meant as an example, to see how difference pieces work together. 

## Run Sandbox

First, spin up the Aztec PXE through Docker.

```
/bin/bash -c "$(curl -fsSL 'https://sandbox.aztec.network')"
OR
cd ~/.aztec && docker-compose up   
```

## Compile & deploy contract

```
aztec-cli compile contracts/token
```

Deploy token contract:
```
node src/deploy.mjs
```

Add the address of the deployed contract to `addresses.json`.

## Run backend

Spin up node backend:
```
node src/index.mjs
```

This will run on localhost:3001. 

## Run frontend

```
cd my-react-app
npm start
```

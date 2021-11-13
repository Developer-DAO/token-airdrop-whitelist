import { ERC721 } from "@0xcert/ethereum-erc721/build/erc721.json";
import Web3 from "web3";

const CONTRACT_ACCOUNT = "0x25ed58c027921E14D86380eA2646E3a1B5C55A8b";
const CONTRACT_START = 13153967;
const INFURA_KEY = "263a394bc14c4107949a73b0fb485ebb";
const fs = require("fs");

const web3 = new Web3(
  new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/" + INFURA_KEY)
);
const erc721 = ERC721;
const contract = new web3.eth.Contract(erc721.abi as any, CONTRACT_ACCOUNT);

const idToNumber: Record<string, number> = {};

console.info("Fetching transfers...");
contract
  .getPastEvents("Transfer", { fromBlock: CONTRACT_START })
  .then((events) => {
    events.forEach((event) => {
      /* if the user does not yet have one token, add one */
      if (!idToNumber[event.returnValues._to]) {
        idToNumber[event.returnValues._to] = 1;
      } else {
        /* if they already have one, add another one */
        idToNumber[event.returnValues._to] =
          idToNumber[event.returnValues._to] + 1;
      }
      if (idToNumber[event.returnValues._from]) {
        /* if the user is sending a token to someone else, remove the token from their count */
        idToNumber[event.returnValues._from] =
          idToNumber[event.returnValues._from] - 1;
      }
    });

    const filteredArr: string[] = [];

    Object.entries(idToNumber).forEach((item) => {
      if (item[1] !== Number(0)) {
        filteredArr.push(item[0]);
      }
    });

    fs.writeFileSync("./snapshot.json", JSON.stringify(filteredArr));
  });

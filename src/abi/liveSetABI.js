export const liveSetABI = [
    { "type": "constructor", "inputs": [], "stateMutability": "nonpayable" },
    {
      "type": "function",
      "name": "addSet",
      "inputs": [
        { "name": "artist_id", "type": "uint16", "internalType": "uint16" },
        { "name": "blockheight", "type": "uint64", "internalType": "uint64" },
        { "name": "shape", "type": "uint8", "internalType": "uint8" },
        { "name": "order", "type": "uint8", "internalType": "uint8" },
        {
          "name": "rabbitHashes",
          "type": "bytes32[]",
          "internalType": "bytes32[]"
        },
        {
          "name": "stonePriceWei",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getSetForShow",
      "inputs": [
        { "name": "artist_id", "type": "uint16", "internalType": "uint16" },
        { "name": "blockheight", "type": "uint64", "internalType": "uint64" },
        { "name": "order", "type": "uint8", "internalType": "uint8" }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct LiveSet.Set",
          "components": [
            { "name": "shape", "type": "uint8", "internalType": "uint8" },
            { "name": "order", "type": "uint8", "internalType": "uint8" },
            {
              "name": "rabbitHashes",
              "type": "bytes32[]",
              "internalType": "bytes32[]"
            },
            {
              "name": "stonePriceWei",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getSetForShowByShowBytes",
      "inputs": [
        { "name": "showBytes", "type": "bytes32", "internalType": "bytes32" },
        { "name": "order", "type": "uint8", "internalType": "uint8" }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct LiveSet.Set",
          "components": [
            { "name": "shape", "type": "uint8", "internalType": "uint8" },
            { "name": "order", "type": "uint8", "internalType": "uint8" },
            {
              "name": "rabbitHashes",
              "type": "bytes32[]",
              "internalType": "bytes32[]"
            },
            {
              "name": "stonePriceWei",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getShowIds",
      "inputs": [],
      "outputs": [
        { "name": "", "type": "bytes32[]", "internalType": "bytes32[]" }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "isValidSet",
      "inputs": [
        { "name": "showBytes", "type": "bytes32", "internalType": "bytes32" },
        { "name": "order", "type": "uint8", "internalType": "uint8" }
      ],
      "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "sets",
      "inputs": [
        { "name": "", "type": "bytes32", "internalType": "bytes32" },
        { "name": "", "type": "uint8", "internalType": "uint8" }
      ],
      "outputs": [
        { "name": "shape", "type": "uint8", "internalType": "uint8" },
        { "name": "order", "type": "uint8", "internalType": "uint8" },
        {
          "name": "stonePriceWei",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "show_ids",
      "inputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
      "stateMutability": "view"
    }
]
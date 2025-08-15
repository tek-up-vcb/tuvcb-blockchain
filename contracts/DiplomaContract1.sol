// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DiplomaContract {
    bytes32 public merkleRoot;
    mapping(bytes32 => string) private diplomas;

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    function registerDiploma(bytes32 leaf, string memory ipfsHash) public {
        diplomas[leaf] = ipfsHash;
    }

    function getDiplomaIpfs(bytes32 leaf) public view returns (string memory) {
        return diplomas[leaf];
    }
}

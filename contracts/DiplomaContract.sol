// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DiplomaContract {
    bytes32 public merkleRoot;
    mapping(bytes32 => string) public diplomaIpfsLinks;

    constructor(bytes32 _root) {
        merkleRoot = _root;
    }

    function registerDiploma(bytes32 leaf, string memory ipfsLink) public {
        diplomaIpfsLinks[leaf] = ipfsLink;
    }

    function getDiplomaIpfs(bytes32 leaf) public view returns (string memory) {
        return diplomaIpfsLinks[leaf];
    }
}

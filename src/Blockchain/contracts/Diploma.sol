// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract DiplomaRegistry {
    // Structure représentant un diplôme
    struct Diploma {
        string ipfsHash;   // le hash du fichier JSON sur IPFS
        address owner;     // l'adresse du propriétaire actuel
        bool valid;        // indicateur de validité (par ex. pour révoquer si besoin)
    }

    // Mapping d'un identifiant de diplôme vers les informations du diplôme
    mapping(uint256 => Diploma) public diplomas;
    uint256 public diplomaCount;  // compteur pour assigner des IDs de diplôme

    // Events pour suivre les opérations (création, transfert)
    event DiplomaIssued(uint256 indexed diplomaId, address indexed owner, string ipfsHash);
    event DiplomaTransferred(uint256 indexed diplomaId, address indexed oldOwner, address indexed newOwner);

    // Création d'un nouveau diplôme. L'adresse appelante devient propriétaire.
    function issueDiploma(string memory ipfsHash) public returns (uint256) {
        uint256 newId = diplomaCount;
        diplomas[newId] = Diploma(ipfsHash, msg.sender, true);
        diplomaCount += 1;
        emit DiplomaIssued(newId, msg.sender, ipfsHash);
        return newId;
    }

    // Transfert d'un diplôme existant à un nouveau propriétaire.
    function transferDiploma(uint256 diplomaId, address newOwner) public {
        require(diplomaId < diplomaCount, "Diploma does not exist");
        Diploma storage diploma = diplomas[diplomaId];
        require(diploma.valid, "Diploma is not valid");
        require(msg.sender == diploma.owner, "Only the owner can transfer this diploma");
        address previousOwner = diploma.owner;
        diploma.owner = newOwner;
        emit DiplomaTransferred(diplomaId, previousOwner, newOwner);
    }

    // (Optionnel) Invalider un diplôme (ex: si erreur ou révocation)
    function revokeDiploma(uint256 diplomaId) public {
        require(diplomaId < diplomaCount, "Diploma does not exist");
        Diploma storage diploma = diplomas[diplomaId];
        require(msg.sender == diploma.owner, "Only owner can revoke");
        diploma.valid = false;
        // On pourrait émettre un event de révocation si besoin
    }

    // Récupérer les infos d'un diplôme (owner, hash, validité)
    function getDiploma(uint256 diplomaId) public view returns (string memory, address, bool) {
        require(diplomaId < diplomaCount, "Diploma does not exist");
        Diploma memory d = diplomas[diplomaId];
        return (d.ipfsHash, d.owner, d.valid);
    }
}
